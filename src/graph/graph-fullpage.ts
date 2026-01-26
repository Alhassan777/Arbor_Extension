/**
 * Full-page graph view for tree visualization
 * Loads tree data from IndexedDB and renders it using GraphRenderer
 */

import { db } from "../storage/indexeddb";
import { GraphRenderer } from "../content/modules/GraphRenderer";
import { GraphPanZoom } from "../content/modules/GraphPanZoom";
import type { ChatTree } from "../types";

class FullPageGraphView {
  private currentTreeId: string | null = null;
  private trees: Record<string, ChatTree> = {};
  private graphRenderer: GraphRenderer;
  private graphPanZoom: GraphPanZoom;
  private isTreeSelectorOpen: boolean = false;
  private storageListenerActive: boolean = false;

  constructor() {
    // Initialize graph renderer and pan/zoom
    this.graphRenderer = new GraphRenderer(
      (nodeId: string) => this.handleNodeClick(nodeId),
      async (childId: string, parentId: string) =>
        this.handleConnectionLabelClick(childId, parentId),
    );

    this.graphPanZoom = new GraphPanZoom();
    this.graphRenderer.setGraphPanZoom(this.graphPanZoom);
  }

  async init() {
    try {
      console.log("🌳 Arbor Graph: Initializing full-page view");
      console.log("🌳 Arbor Graph: Checking extension context...");

      // Check if extension context is still valid
      if (!this.isExtensionContextValid()) {
        console.error("🌳 Arbor Graph: Extension context invalidated at init");
        this.showExtensionReloadError();
        return;
      }

      console.log("🌳 Arbor Graph: Extension context is valid");
      console.log("🌳 Arbor Graph: chrome.runtime.id:", chrome.runtime.id);

      // Initialize database with retry logic for context issues
      console.log("🌳 Arbor Graph: Initializing database...");
      try {
        await db.init();
        console.log("🌳 Arbor Graph: Database initialized successfully");
      } catch (dbError) {
        console.error("🌳 Arbor Graph: Database init failed:", dbError);
        const errorMsg =
          dbError instanceof Error ? dbError.message : String(dbError);
        if (errorMsg.includes("Extension context")) {
          this.showExtensionReloadError();
          return;
        }
        throw dbError;
      }

      // Get tree ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const treeId = urlParams.get("treeId");
      console.log("🌳 Arbor Graph: Tree ID from URL:", treeId);
      console.log("🌳 Arbor Graph: Full URL:", window.location.href);

      // Load all trees first to populate the selector
      console.log("🌳 Arbor Graph: Loading all trees for selector...");
      await this.loadAllTrees();
      let treeCount = Object.keys(this.trees).length;
      console.log("🌳 Arbor Graph: Found", treeCount, "trees in database");

      // If no trees found, force migration from IndexedDB and try again
      if (treeCount === 0) {
        console.log(
          "🌳 Arbor Graph: No trees found, forcing migration from IndexedDB...",
        );
        try {
          await db.forceMigration();
        } catch (error) {
          console.error("🌳 Arbor Graph: Migration failed:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        await this.loadAllTrees();
        treeCount = Object.keys(this.trees).length;
        console.log(
          "🌳 Arbor Graph: After forced migration, found",
          treeCount,
          "trees",
        );
      }

      if (treeCount === 0) {
        console.warn("🌳 Arbor Graph: ⚠️ Database is empty! No trees found.");
        console.log("🌳 Arbor Graph: This could mean:");
        console.log("  1. No trees have been created yet");
        console.log("  2. Trees were not saved properly to IndexedDB");
        console.log("  3. Database synchronization issue");
      }

      if (!treeId) {
        console.warn("🌳 Arbor Graph: No tree ID provided in URL");
        this.showError(
          "No tree selected",
          "Please select a tree from the dropdown to view.",
        );
        this.updateTreeSelector();
        this.setupEventListeners();
        this.hideLoading();
        return;
      }

      // Check if the tree exists before trying to load it
      if (!this.trees[treeId]) {
        console.error(
          "🌳 Arbor Graph: Tree not found in loaded trees:",
          treeId,
        );
        console.log(
          "🌳 Arbor Graph: Available tree IDs:",
          Object.keys(this.trees),
        );

        const errorMessage =
          Object.keys(this.trees).length === 0
            ? `The database appears to be empty. This could happen if:

• Trees haven't been created yet - create a tree in the sidebar first
• The extension was just installed/updated - try refreshing the main page
• There's a database synchronization issue - please report this bug

Try closing this window and:
1. Go to a ChatGPT conversation
2. Create a new tree using the Arbor sidebar
3. Reopen the graph view from the sidebar`
            : `The requested tree (ID: ${treeId.substring(0, 8)}...) was not found in the database. 

It may have been deleted, or there might be a synchronization issue.

Please select another tree from the dropdown, or create a new tree in the sidebar.`;

        this.showError("Tree not found", errorMessage);
        this.updateTreeSelector();
        this.setupEventListeners();
        this.hideLoading();
        return;
      }

      // Load tree data
      console.log("🌳 Arbor Graph: Loading tree:", treeId);
      await this.loadTree(treeId);

      // Set up event listeners
      this.setupEventListeners();

      // Hide loading state
      this.hideLoading();
      console.log("🌳 Arbor Graph: Initialization complete");
    } catch (error) {
      console.error("🌳 Arbor Graph: Failed to initialize:", error);

      // Check if it's an extension context error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Extension context invalidated")) {
        this.showExtensionReloadError();
      } else {
        this.showError(
          "Failed to load tree",
          `An error occurred while loading the tree data: ${errorMessage}`,
        );
      }
    }
  }

  private isExtensionContextValid(): boolean {
    try {
      // Try to access chrome.runtime - if it throws, context is invalid
      if (typeof chrome === "undefined") {
        console.error("🌳 Arbor Graph: chrome object is undefined");
        return false;
      }
      if (!chrome.runtime) {
        console.error("🌳 Arbor Graph: chrome.runtime is undefined");
        return false;
      }
      if (!chrome.runtime.id) {
        console.error("🌳 Arbor Graph: chrome.runtime.id is undefined");
        return false;
      }

      // Try to call a chrome API to verify it works
      try {
        chrome.runtime.getURL("test");
      } catch (e) {
        console.error("🌳 Arbor Graph: chrome.runtime.getURL failed:", e);
        return false;
      }

      return true;
    } catch (error) {
      console.error("🌳 Arbor Graph: Extension context check failed:", error);
      return false;
    }
  }

  private showExtensionReloadError() {
    const loadingState = document.getElementById("loading-state");
    const graphContent = document.getElementById("graph-content");

    if (loadingState) loadingState.style.display = "none";

    // Check if we're likely in development mode
    const isDev =
      window.location.protocol === "chrome-extension:" &&
      (navigator.userAgent.includes("Chrome") ||
        navigator.userAgent.includes("Chromium"));

    const devNote = isDev
      ? `
      <div style="margin-top: 12px; padding: 12px; background: rgba(201, 166, 107, 0.1); border-radius: 6px; font-size: 13px; color: var(--arbor-text-secondary);">
        <strong style="color: var(--arbor-accent);">Development Note:</strong> If using <code>npm run dev</code>, 
        the extension auto-reloads on file changes. Close this window and reopen it from the main page.
      </div>
    `
      : "";

    if (graphContent) {
      graphContent.innerHTML = `
        <div class="error-state">
          <div class="error-icon">🔄</div>
          <div class="error-title">Extension Context Lost</div>
          <div class="error-message">
            The Arbor extension was reloaded, updated, or lost connection. Please close this window 
            and open the graph view again from the main Arbor sidebar.
          </div>
          ${devNote}
          <div style="display: flex; gap: 12px; margin-top: 16px;">
            <button id="reload-page-btn">Reload Page</button>
            <button id="close-window-btn-error" style="
              padding: 10px 20px;
              background: transparent;
              color: var(--arbor-text-secondary);
              border: 1px solid var(--arbor-border-default);
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 150ms ease;
            ">Close Window</button>
          </div>
        </div>
      `;
      graphContent.style.display = "flex";
      graphContent.style.alignItems = "center";
      graphContent.style.justifyContent = "center";
      graphContent.style.height = "100%";

      // Add click handlers
      const reloadBtn = document.getElementById("reload-page-btn");
      if (reloadBtn) {
        reloadBtn.addEventListener("click", () => {
          window.location.reload();
        });
      }

      const closeBtn = document.getElementById("close-window-btn-error");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          window.close();
        });
      }
    }
  }

  private async loadTree(treeId: string) {
    try {
      // Check extension context before attempting database access
      if (!this.isExtensionContextValid()) {
        console.error(
          "🌳 Arbor Graph: Extension context invalid before loadTree",
        );
        this.showExtensionReloadError();
        return;
      }

      // Get tree from cache or database
      let tree: ChatTree | undefined = this.trees[treeId];

      if (!tree) {
        console.log(
          "🌳 Arbor Graph: Tree not in cache, fetching from database:",
          treeId,
        );
        const fetchedTree = await db.getTree(treeId);
        console.log(
          "🌳 Arbor Graph: Tree fetched:",
          fetchedTree
            ? `Found (${Object.keys(fetchedTree.nodes).length} nodes)`
            : "Not found",
        );

        if (!fetchedTree) {
          console.warn("🌳 Arbor Graph: Tree not found in database");
          this.showError(
            "Tree not found",
            "The requested tree could not be found. It may have been deleted. Please select another tree from the dropdown.",
          );
          return;
        }

        // Add to cache
        tree = fetchedTree;
        this.trees[treeId] = tree;
      } else {
        console.log(
          `🌳 Arbor Graph: Using cached tree data (${Object.keys(tree.nodes).length} nodes)`,
        );
      }

      this.currentTreeId = treeId;
      console.log("🌳 Arbor Graph: Tree loaded successfully");

      // Update tree selector
      this.updateTreeSelector();

      // Set current tree in renderer
      console.log("🌳 Arbor Graph: Setting current tree in renderer");
      await this.graphRenderer.setCurrentTree(treeId);
      this.graphRenderer.setCurrentNode(null);

      // Render the graph
      console.log("🌳 Arbor Graph: Rendering graph");
      this.graphRenderer.renderGraph(tree, "graph-content");

      // Initialize pan/zoom after rendering
      setTimeout(() => {
        console.log("🌳 Arbor Graph: Initializing pan/zoom");
        this.graphPanZoom.init("graph-canvas", "graph-content");
        this.graphPanZoom.setOnScaleChange(() => this.updateZoomLevel());
        this.updateZoomLevel();
        // Check reset button visibility after initialization
        this.checkResetButtonVisibility();
      }, 100);

      // Set up reset layout listener
      const resetBtn = document.getElementById("reset-layout-btn");
      if (resetBtn) {
        // Remove any existing listeners to avoid duplicates
        const newResetBtn = resetBtn.cloneNode(true) as HTMLElement;
        resetBtn.parentNode?.replaceChild(newResetBtn, resetBtn);

        newResetBtn.addEventListener("click", async () => {
          console.log("🌳 Arbor Graph: Resetting layout");
          await this.graphRenderer.resetToAutoLayout();
          if (tree) {
            this.graphRenderer.renderGraph(tree, "graph-content");
          }
          this.checkResetButtonVisibility();
        });

        // Listen for reset layout event
        window.addEventListener("arbor-reset-layout", async () => {
          if (tree) {
            this.graphRenderer.renderGraph(tree, "graph-content");
          }
          this.checkResetButtonVisibility();
        });
      }

      // Note: Pan/zoom changes no longer affect reset-layout-btn visibility
      // The reset-layout-btn only shows when layout structure is manually changed

      console.log("🌳 Arbor Graph: Tree loaded and rendered successfully");
    } catch (error) {
      console.error("🌳 Arbor Graph: Error loading tree:", error);
      throw error;
    }
  }

  private async loadAllTrees() {
    try {
      if (!this.isExtensionContextValid()) {
        console.error(
          "🌳 Arbor Graph: Extension context invalid in loadAllTrees",
        );
        return;
      }

      const allTrees = await db.getAllTrees();
      this.trees = {};
      allTrees.forEach((tree) => {
        this.trees[tree.id] = tree;
      });
      console.log(
        "🌳 Arbor Graph: Loaded all trees:",
        Object.keys(this.trees).length,
      );
    } catch (error) {
      console.error("🌳 Arbor Graph: Error loading all trees:", error);
      if (
        error instanceof Error &&
        error.message.includes("Extension context")
      ) {
        this.showExtensionReloadError();
      }
      throw error;
    }
  }

  private updateTreeSelector() {
    const trigger = document.getElementById("tree-selector-content");
    const menu = document.getElementById("tree-selector-menu");

    if (!trigger || !menu) {
      console.warn("🌳 Arbor Graph: Tree selector elements not found");
      return;
    }

    console.log(
      "🌳 Arbor Graph: Updating tree selector with",
      Object.keys(this.trees).length,
      "trees",
    );

    // Update trigger text
    if (this.currentTreeId && this.trees[this.currentTreeId]) {
      const tree = this.trees[this.currentTreeId];
      const nodeCount = Object.keys(tree.nodes).length;
      trigger.textContent = tree.name || "Untitled Tree";
    } else {
      trigger.textContent = "Select a tree";
    }

    // Build menu items
    const treeList = Object.values(this.trees).sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

    console.log(
      "🌳 Arbor Graph: Rendering",
      treeList.length,
      "trees in dropdown:",
      treeList.map((t) => t.name).join(", "),
    );

    if (treeList.length === 0) {
      menu.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--arbor-text-tertiary); font-size: 13px;">
          No trees found.<br>Create a tree in the sidebar first.
        </div>
        <div class="tree-selector-refresh" id="tree-selector-refresh">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13 3v4h-4M3 13v-4h4M13.5 7A6.5 6.5 0 0 0 3.5 4.5M2.5 9a6.5 6.5 0 0 0 10 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Refresh Trees
        </div>
      `;

      // Add refresh listener
      const refreshBtn = document.getElementById("tree-selector-refresh");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", async () => {
          console.log("🌳 Arbor Graph: User requested tree refresh");
          await this.loadAllTrees();
          this.updateTreeSelector();
          this.closeTreeSelector();
        });
      }
      return;
    }

    menu.innerHTML =
      treeList
        .map((tree) => {
          const nodeCount = Object.keys(tree.nodes).length;
          const isActive = tree.id === this.currentTreeId;
          return `
        <div class="tree-selector-item ${isActive ? "active" : ""}" data-tree-id="${tree.id}">
          <div class="tree-selector-item-title">${tree.name || "Untitled Tree"}</div>
          <div class="tree-selector-item-meta">${nodeCount} nodes</div>
        </div>
      `;
        })
        .join("") +
      `
      <div class="tree-selector-refresh" id="tree-selector-refresh">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M13 3v4h-4M3 13v-4h4M13.5 7A6.5 6.5 0 0 0 3.5 4.5M2.5 9a6.5 6.5 0 0 0 10 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Refresh Trees
      </div>
    `;

    console.log("🌳 Arbor Graph: Tree selector menu HTML updated");

    // Add click listeners to menu items
    menu.querySelectorAll(".tree-selector-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const treeId = (item as HTMLElement).dataset.treeId;
        if (treeId && treeId !== this.currentTreeId) {
          console.log("🌳 Arbor Graph: User selected tree:", treeId);

          // Update URL
          const url = new URL(window.location.href);
          url.searchParams.set("treeId", treeId);
          window.history.pushState({}, "", url.toString());

          // Reload tree
          this.showLoading();
          this.closeTreeSelector();
          await this.loadTree(treeId);
          this.hideLoading();
        }
      });
    });

    // Add refresh listener
    const refreshBtn = document.getElementById("tree-selector-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        console.log("🌳 Arbor Graph: User requested tree refresh");
        this.closeTreeSelector();
        await this.loadAllTrees();
        this.updateTreeSelector();
      });
    }
  }

  private setupEventListeners() {
    // Listen for database changes (tree renames, etc.)
    this.setupStorageListener();

    // Zoom controls
    const zoomInBtn = document.getElementById("zoom-in-btn");
    const zoomOutBtn = document.getElementById("zoom-out-btn");
    const zoomResetBtn = document.getElementById("zoom-reset-btn");

    zoomInBtn?.addEventListener("click", () => {
      const currentScale = this.graphPanZoom.getScale();
      this.graphPanZoom.setScale(currentScale + 0.1);
      this.updateZoomLevel();
    });

    zoomOutBtn?.addEventListener("click", () => {
      const currentScale = this.graphPanZoom.getScale();
      this.graphPanZoom.setScale(currentScale - 0.1);
      this.updateZoomLevel();
    });

    zoomResetBtn?.addEventListener("click", () => {
      this.graphPanZoom.resetZoom();
      this.updateZoomLevel();
    });

    // Fullscreen button
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    fullscreenBtn?.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // Close window button
    const closeWindowBtn = document.getElementById("close-window-btn");
    closeWindowBtn?.addEventListener("click", () => {
      window.close();
    });

    // Tree selector
    const treeSelectorTrigger = document.getElementById(
      "tree-selector-trigger",
    );
    treeSelectorTrigger?.addEventListener("click", () => {
      this.toggleTreeSelector();
    });

    // Close tree selector when clicking outside
    document.addEventListener("click", (e) => {
      const selector = document.querySelector(".tree-selector");
      if (selector && !selector.contains(e.target as Node)) {
        this.closeTreeSelector();
      }
    });

    // Handle browser back/forward
    window.addEventListener("popstate", () => {
      const urlParams = new URLSearchParams(window.location.search);
      const treeId = urlParams.get("treeId");
      if (treeId && treeId !== this.currentTreeId) {
        this.showLoading();
        this.loadTree(treeId).then(() => this.hideLoading());
      }
    });
  }

  private toggleTreeSelector() {
    const trigger = document.getElementById("tree-selector-trigger");
    const menu = document.getElementById("tree-selector-menu");

    if (!trigger || !menu) return;

    this.isTreeSelectorOpen = !this.isTreeSelectorOpen;
    trigger.setAttribute("aria-expanded", this.isTreeSelectorOpen.toString());

    if (this.isTreeSelectorOpen) {
      menu.classList.add("open");
    } else {
      menu.classList.remove("open");
    }
  }

  private closeTreeSelector() {
    const trigger = document.getElementById("tree-selector-trigger");
    const menu = document.getElementById("tree-selector-menu");

    if (!trigger || !menu) return;

    this.isTreeSelectorOpen = false;
    trigger.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
  }

  private updateZoomLevel() {
    const zoomLevel = document.getElementById("zoom-level");
    if (zoomLevel) {
      const scale = this.graphPanZoom.getScale();
      zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  private setupStorageListener() {
    if (this.storageListenerActive) return;

    this.storageListenerActive = true;

    // Listen for update messages from the main extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "graph-window-update-tree") {
        console.log(
          "🌳 Arbor Graph: Received update notification from main extension",
        );
        this.reloadCurrentTree();
      }
    });

    // Also poll for database changes as backup (every 3 seconds)
    const checkInterval = setInterval(async () => {
      if (!this.currentTreeId) return;

      try {
        // Fetch the latest version of the current tree from database
        const updatedTree = await db.getTree(this.currentTreeId);

        if (!updatedTree) {
          console.log("🌳 Arbor Graph: Tree was deleted, clearing view");
          clearInterval(checkInterval);
          this.storageListenerActive = false;
          return;
        }

        const cachedTree = this.trees[this.currentTreeId];

        // Check if tree changed (check updatedAt timestamp)
        if (cachedTree && updatedTree.updatedAt !== cachedTree.updatedAt) {
          console.log("🌳 Arbor Graph: Tree changed, reloading");
          await this.reloadCurrentTree();
        }
      } catch (error) {
        console.error("🌳 Arbor Graph: Error checking for updates:", error);
      }
    }, 3000); // Check every 3 seconds (less frequent since we have message listener)

    // Clean up on page unload
    window.addEventListener("beforeunload", () => {
      clearInterval(checkInterval);
      this.storageListenerActive = false;
    });
  }

  private async reloadCurrentTree() {
    if (!this.currentTreeId) return;

    try {
      console.log("🌳 Arbor Graph: Reloading tree data from database");

      // Fetch fresh data from database
      const updatedTree = await db.getTree(this.currentTreeId);

      if (!updatedTree) {
        console.warn("🌳 Arbor Graph: Tree no longer exists");
        return;
      }

      // Update cache
      this.trees[this.currentTreeId] = updatedTree;

      // Update the tree selector display (shows tree name)
      this.updateTreeSelector();

      // Re-render the graph (will show updated node titles)
      this.graphRenderer.renderGraph(updatedTree, "graph-content");

      console.log("🌳 Arbor Graph: Tree reloaded successfully");
    } catch (error) {
      console.error("🌳 Arbor Graph: Error reloading tree:", error);
    }
  }

  private checkResetButtonVisibility() {
    if (this.graphRenderer && this.graphPanZoom) {
      this.graphRenderer.checkAndShowResetButton(this.graphPanZoom);
    }
  }

  private handleNodeClick(nodeId: string) {
    // Update active node in renderer
    this.graphRenderer.setCurrentNode(nodeId);

    // Re-render to show active state
    if (this.currentTreeId && this.trees[this.currentTreeId]) {
      this.graphRenderer.renderGraph(
        this.trees[this.currentTreeId],
        "graph-content",
      );
    }
  }

  private async handleConnectionLabelClick(childId: string, parentId: string) {
    // For full-page view, we could show a modal to edit connection labels
    // For now, just log it
    console.log("Connection clicked:", { childId, parentId });
  }

  private showLoading() {
    const loadingState = document.getElementById("loading-state");
    const graphContent = document.getElementById("graph-content");

    if (loadingState) loadingState.style.display = "flex";
    if (graphContent) graphContent.style.display = "none";
  }

  private hideLoading() {
    const loadingState = document.getElementById("loading-state");
    const graphContent = document.getElementById("graph-content");

    if (loadingState) loadingState.style.display = "none";
    if (graphContent) graphContent.style.display = "block";
  }

  private showError(title: string, message: string) {
    const loadingState = document.getElementById("loading-state");
    const graphContent = document.getElementById("graph-content");

    if (loadingState) loadingState.style.display = "none";

    if (graphContent) {
      graphContent.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-title">${title}</div>
          <div class="error-message">${message}</div>
        </div>
      `;
      graphContent.style.display = "flex";
      graphContent.style.alignItems = "center";
      graphContent.style.justifyContent = "center";
      graphContent.style.height = "100%";
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const view = new FullPageGraphView();
    view.init();
  });
} else {
  const view = new FullPageGraphView();
  view.init();
}
