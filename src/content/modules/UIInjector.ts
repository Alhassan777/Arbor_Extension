/**
 * UIInjector - Orchestrates UI injection and management
 * Refactored to use smaller, focused modules
 */

import type { ChatTree } from "../../types";
import { StyleInjector } from "./StyleInjector";
import { SidebarRenderer } from "./SidebarRenderer";
import { GraphViewRenderer } from "./GraphViewRenderer";
import { ToggleButtonsManager } from "./ToggleButtonsManager";
import { SidebarListeners } from "./SidebarListeners";
import { db } from "../db";

export interface AvailableChat {
  id: string;
  title: string;
  url: string;
  platform: "chatgpt" | "gemini" | "claude" | "perplexity";
}

export class UIInjector {
  private onSidebarAction: (action: string, data?: any) => void;
  private toggleButtonsManager: ToggleButtonsManager;
  private sidebarListeners: SidebarListeners;

  constructor(onSidebarAction: (action: string, data?: any) => void) {
    this.onSidebarAction = onSidebarAction;
    this.toggleButtonsManager = new ToggleButtonsManager(
      () => this.toggleSidebar(),
      () => this.toggleGraph()
    );
    this.sidebarListeners = new SidebarListeners(onSidebarAction, () =>
      this.toggleSidebar()
    );
  }

  injectStyles() {
    StyleInjector.inject();
  }

  async injectSidebar(
    trees: Record<string, ChatTree>,
    currentTreeId: string | null,
    untrackedChats: AvailableChat[]
  ) {
    let sidebar = document.getElementById("arbor-sidebar-container");

    if (!sidebar) {
      sidebar = document.createElement("div");
      sidebar.id = "arbor-sidebar-container";
      document.body.insertBefore(sidebar, document.body.firstChild);
      // Sidebar overlays, no need to adjust body margins
    }

    // Check API key availability
    const hasApiKey = await this.checkApiKeyAvailability();

    sidebar.innerHTML = SidebarRenderer.render(
      trees,
      currentTreeId,
      untrackedChats,
      hasApiKey
    );

    this.sidebarListeners.attach();
    this.toggleButtonsManager.inject();
    // Sync button state with sidebar visibility (sidebar starts visible)
    this.toggleButtonsManager.updateSidebarState(
      !sidebar.classList.contains("hidden")
    );

    // Attach settings button listener in header (always visible)
    const openSettingsFromSidebarBtn = document.getElementById("open-settings-from-sidebar-btn");
    if (openSettingsFromSidebarBtn) {
      openSettingsFromSidebarBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "open-options-page" });
      });
    }

    // Attach settings button listener if API key notice is shown
    if (!hasApiKey) {
      const openSettingsBtn = document.getElementById("open-settings-btn");
      if (openSettingsBtn) {
        openSettingsBtn.addEventListener("click", () => {
          chrome.runtime.sendMessage({ action: "open-options-page" });
        });
      }
    }
  }

  private setupLogoFallback(sidebar: HTMLElement) {
    const logoImg = sidebar.querySelector<HTMLImageElement>(".arbor-logo[data-logo-fallback]");
    const fallbackSVG = sidebar.querySelector<HTMLElement>(".arbor-logo-fallback");
    
    if (logoImg && fallbackSVG) {
      // Use addEventListener instead of inline onerror to avoid CSP violations
      logoImg.addEventListener("error", () => {
        logoImg.style.display = "none";
        if (fallbackSVG) {
          fallbackSVG.style.display = "block";
        }
      });
      
      // Also check if image loaded successfully after a short delay
      // This handles cases where the image URL is invalid but doesn't trigger error event
      setTimeout(() => {
        if (logoImg && !logoImg.complete && !logoImg.naturalHeight) {
          logoImg.style.display = "none";
          if (fallbackSVG) {
            fallbackSVG.style.display = "block";
          }
        }
      }, 100);
    }
  }

  private async checkApiKeyAvailability(): Promise<boolean> {
    try {
      // Check all providers in parallel to see if any API key is available
      // This is a simplified check - we just want to know if the user needs to set up an API key
      const providers = ["gemini", "openai", "anthropic"] as const;
      
      const checks = providers.map((provider) => 
        new Promise<boolean>((resolve) => {
          chrome.runtime.sendMessage(
            {
              action: "check-availability",
              payload: { provider },
            },
            (response) => {
              if (chrome.runtime.lastError) {
                resolve(false);
                return;
              }
              resolve(response?.available === true);
            }
          );
        })
      );

      const results = await Promise.all(checks);
      // Return true if ANY provider has an API key available
      return results.some(available => available);
    } catch (error) {
      console.error("Error checking API key availability:", error);
      // Default to true to avoid showing the notice if check fails
      return true;
    }
  }

  injectGraphView() {
    let graph = document.getElementById("arbor-graph-container");

    if (!graph) {
      graph = document.createElement("div");
      graph.id = "arbor-graph-container";
      graph.innerHTML = GraphViewRenderer.render();
      document.body.appendChild(graph);

      // Graph overlays, no need to adjust body margins
      // Update floating button state
      this.toggleButtonsManager.updateGraphState(true);

      // Add close button listener
      graph.querySelector("#close-graph-btn")?.addEventListener("click", () => {
        this.toggleGraph();
      });

      // Add full-page button listener
      graph.querySelector("#open-fullpage-graph-btn")?.addEventListener("click", () => {
        this.openFullPageGraph();
      });
    }
  }

  private async openFullPageGraph() {
    // Get current tree ID from IndexedDB via db module
    try {
      const state = await db.getState();
      const treeId = state.currentTreeId;

      if (!treeId) {
        console.warn("No current tree ID found");
        alert("Please select a tree first to open the graph view.");
        return;
      }

      // Get the full-page graph URL
      const fullPageUrl = chrome.runtime.getURL(
        `graph-fullpage.html?treeId=${treeId}`
      );

      // Open in new window
      window.open(fullPageUrl, "_blank", "width=1200,height=800");
    } catch (error) {
      console.error("Failed to open full-page graph:", error);
      alert("Failed to open graph view. Please try again.");
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById("arbor-sidebar-container");
    if (sidebar) {
      const isHidden = sidebar.classList.contains("hidden");

      if (isHidden) {
        sidebar.classList.remove("hidden");
        // Sidebar is now visible
        this.toggleButtonsManager.updateSidebarState(true);
      } else {
        sidebar.classList.add("hidden");
        // Sidebar is now hidden
        this.toggleButtonsManager.updateSidebarState(false);
      }
    }
  }

  toggleGraph() {
    const graph = document.getElementById("arbor-graph-container");
    if (graph) {
      const isHidden = graph.classList.contains("hidden");

      if (isHidden) {
        graph.classList.remove("hidden");
        // Graph is now visible
        this.toggleButtonsManager.updateGraphState(true);
      } else {
        graph.classList.add("hidden");
        // Graph is now hidden
        this.toggleButtonsManager.updateGraphState(false);
      }
    }
  }

  showGraph() {
    const graph = document.getElementById("arbor-graph-container");
    if (graph) {
      graph.classList.remove("hidden");
      this.toggleButtonsManager.updateGraphState(true);
    }
  }

  hideGraph() {
    const graph = document.getElementById("arbor-graph-container");
    if (graph) {
      graph.classList.add("hidden");
      this.toggleButtonsManager.updateGraphState(false);
    }
  }
}
