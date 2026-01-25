/**
 * Arbor Extension - Content Script (Refactored & Modular)
 *
 * Main orchestrator for the browser extension.
 * Now only ~350 lines (down from 2759!)
 */

import { db } from "./db";
import { detectPlatform } from "./platformDetector";
import { chatgptPlatform } from "../platforms/chatgpt";
import { PlatformFactory } from "../platforms/factory";
import { GraphRenderer } from "./modules/GraphRenderer";
import { ConnectionLabelsManager } from "./modules/ConnectionLabels";
import { SidebarObserver } from "./modules/SidebarObserver";
import { StateManager } from "./modules/StateManager";
import { TreeManager } from "./modules/TreeManager";
import { NodeManager } from "./modules/NodeManager";
import { NodeInteractions } from "./modules/NodeInteractions";
import { ChatDetector } from "./modules/ChatDetector";
import { UIInjector } from "./modules/UIInjector";
import { GraphPanZoom } from "./modules/GraphPanZoom";
import {
  BranchConnectionTypeDialog,
  type BranchDialogResult,
} from "./modules/BranchConnectionTypeDialog";
import { formatErrorForUI } from "../utils/errorMessages";
import type { ExtensionState, ChatTree, ConnectionType } from "../types";
import type { AvailableChat } from "./modules/ChatDetector";

class ArborExtension {
  private state: ExtensionState = {
    currentTreeId: null,
    currentNodeId: null,
    sidebarVisible: true,
    graphSidebarVisible: false,
    trees: {},
  };

  private availableChats: AvailableChat[] = [];
  private sidebarInjected = false;
  private platform: "chatgpt" | "gemini" | "claude" | "perplexity";
  private cleanupFunctions: Array<() => void> = [];

  // Render throttling
  private renderDebounceTimer: number | null = null;
  private isDirty = false;
  private lastRenderedTreeId: string | null = null;

  // Modules
  private graphRenderer: GraphRenderer;
  private connectionLabels: ConnectionLabelsManager;
  private sidebarObserver: SidebarObserver;
  private stateManager: StateManager;
  private treeManager: TreeManager;
  private nodeManager: NodeManager;
  private nodeInteractions: NodeInteractions;
  private chatDetector: ChatDetector;
  private uiInjector: UIInjector;
  private graphPanZoom: GraphPanZoom;
  private branchContextManager: any = null; // Lazy loaded

  constructor(platform: "chatgpt" | "gemini" | "claude" | "perplexity") {
    this.platform = platform;

    // Initialize modules with proper callbacks
    this.graphRenderer = new GraphRenderer(
      (nodeId) => this.handleNodeClick(nodeId),
      (childId, parentId) => this.handleConnectionLabelClick(childId, parentId),
    );
    this.connectionLabels = new ConnectionLabelsManager();
    this.sidebarObserver = new SidebarObserver();
    this.stateManager = new StateManager();
    this.treeManager = new TreeManager();
    this.nodeManager = new NodeManager();
    this.nodeInteractions = new NodeInteractions();
    this.chatDetector = new ChatDetector(platform);
    this.uiInjector = new UIInjector((action, data) =>
      this.handleSidebarAction(action, data),
    );
    this.graphPanZoom = new GraphPanZoom();
    // BranchContextManager is lazy loaded on demand

    this.init();
  }

  async init() {
    console.log("🌳 Arbor Extension: Initializing...");

    // Listen for model download completion
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "model-download-complete") {
        console.log(
          `🌳 Arbor: ✅ Model downloaded successfully in ${message.loadTime}s`,
        );
        this.showNotification(
          `Model ready! Downloaded in ${message.loadTime}s`,
          "success",
        );
      }
      return false;
    });

    await db.init();
    console.log("✅ IndexedDB initialized");

    await this.loadState();
    console.log("✅ State loaded");

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.onPageReady());
    } else {
      this.onPageReady();
    }
  }

  private async loadState() {
    const savedState = await this.stateManager.loadState();
    Object.assign(this.state, savedState);

    const trees = await this.stateManager.loadTrees();
    this.state.trees = trees;
  }

  private async saveState() {
    await this.stateManager.saveState({
      currentTreeId: this.state.currentTreeId,
      currentNodeId: this.state.currentNodeId,
    });
  }

  private async getBranchContextManager(): Promise<any> {
    if (!this.branchContextManager) {
      const { BranchContextManager } =
        await import("./modules/BranchContextManager");
      this.branchContextManager = new BranchContextManager(this.platform);
    }
    return this.branchContextManager;
  }

  private onPageReady() {
    console.log("📄 Page ready");

    this.injectUI();
    this.setupSidebarObserver();
    this.scanAvailableChats();
    this.detectAndTrackCurrentChat();
    this.handleAutoPasteAndTreeAddition();
    this.setupNavigationListener();

    // Visibility-aware periodic updates
    this.setupVisibilityAwareScanning();
  }

  private setupVisibilityAwareScanning() {
    let chatScanInterval: number | null = null;
    let trackingInterval: number | null = null;
    let isVisible = !document.hidden;
    let consecutiveNoChanges = 0;

    const startScanning = () => {
      if (chatScanInterval !== null || trackingInterval !== null) return;

      // Adaptive intervals: start with shorter intervals, increase if no changes
      const getChatScanInterval = () => {
        // Start at 8s, increase to 20s max (reduced from 10s/30s)
        return consecutiveNoChanges > 5 ? 20000 : 8000;
      };
      const getTrackingInterval = () => {
        // Start at 4s, increase to 10s max (reduced from 5s/15s)
        return consecutiveNoChanges > 5 ? 10000 : 4000;
      };

      // Chat scanning with exponential backoff
      const scanChats = async () => {
        const beforeCount = this.availableChats.length;
        await this.scanAvailableChats();
        const afterCount = this.availableChats.length;

        if (beforeCount === afterCount) {
          consecutiveNoChanges++;
        } else {
          consecutiveNoChanges = 0;
        }
      };

      chatScanInterval = window.setInterval(() => {
        if (isVisible) scanChats();
      }, getChatScanInterval());

      trackingInterval = window.setInterval(() => {
        if (isVisible) this.detectAndTrackCurrentChat();
      }, getTrackingInterval());
    };

    const stopScanning = () => {
      if (chatScanInterval !== null) {
        clearInterval(chatScanInterval);
        chatScanInterval = null;
      }
      if (trackingInterval !== null) {
        clearInterval(trackingInterval);
        trackingInterval = null;
      }
    };

    // Handle visibility changes
    const handleVisibilityChange = () => {
      const wasVisible = isVisible;
      isVisible = !document.hidden;

      if (isVisible && !wasVisible) {
        // Tab became visible - scan immediately and restart intervals
        console.log("🌳 Arbor: Tab visible, resuming scans");
        consecutiveNoChanges = 0; // Reset backoff
        stopScanning();
        this.scanAvailableChats();
        this.detectAndTrackCurrentChat();
        startScanning();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Store cleanup function
    this.cleanupFunctions.push(() => {
      stopScanning();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });

    // Start scanning
    startScanning();
  }

  /**
   * Set up navigation listener to detect when new chats are created
   */
  private setupNavigationListener() {
    // Get the active platform adapter using the factory
    const platformAdapter = PlatformFactory.getActivePlatform();

    if (!platformAdapter) {
      console.warn(
        "🌳 Arbor: No active platform found for navigation listener",
      );
      return;
    }

    let lastChatId: string | null = platformAdapter.getChatId();

    const cleanup = platformAdapter.onNavigationChange(async (chatId) => {
      // Chat ID changed - might be a new chat from branch creation
      if (chatId !== lastChatId) {
        lastChatId = chatId;

        // Check if we have branch context to handle (using secure chrome.storage.session)
        try {
          const data = await chrome.storage.session.get([
            "arbor_branch_parent_node_id",
            "arbor_branch_parent_tree_id",
            "arbor_branch_timestamp",
          ]);

          const parentNodeId = data.arbor_branch_parent_node_id;
          const parentTreeId = data.arbor_branch_parent_tree_id;
          const timestamp = data.arbor_branch_timestamp;

          // Only process if we have the required info and it's recent (within 5 minutes)
          if (parentNodeId && parentTreeId && chatId && timestamp) {
            const branchTime = parseInt(timestamp, 10);
            const now = Date.now();
            if (now - branchTime <= 5 * 60 * 1000) {
              // Wait a bit for the chat to fully load
              setTimeout(async () => {
                await this.addNewChatToTreeIfNeeded(parentNodeId, parentTreeId);
              }, 2000);
            } else {
              // Too old, clear it
              this.clearBranchContext();
            }
          }
        } catch (error) {
          console.error("Failed to retrieve branch context:", error);
        }
      }
    });

    // Store cleanup function for later
    this.cleanupFunctions.push(cleanup);
  }

  private setupSidebarObserver() {
    this.sidebarObserver.start(() => {
      if (this.sidebarInjected) {
        console.log("🔄 Re-injecting UI after removal");
        this.injectUI();
      }
    });
  }

  private injectUI() {
    if (this.sidebarInjected) {
      const existing = document.getElementById("arbor-sidebar-container");
      if (existing) return;
    }

    this.uiInjector.injectStyles();
    this.refreshSidebar();
    this.uiInjector.injectGraphView();
    this.attachGraphListeners();
    this.attachZoomControls();
    this.graphPanZoom.init();
    this.graphPanZoom.setOnScaleChange(() => this.updateZoomDisplay());
    this.graphRenderer.setGraphPanZoom(this.graphPanZoom);

    this.sidebarInjected = true;
    console.log("✅ UI injected");

    // Render graph if a tree is selected (for re-injection scenarios)
    if (this.state.currentTreeId) {
      setTimeout(() => {
        this.renderGraph();
      }, 100);
    }
  }

  private attachZoomControls() {
    document.getElementById("zoom-in-btn")?.addEventListener("click", () => {
      const currentScale = this.graphPanZoom.getScale();
      this.graphPanZoom.setScale(currentScale + 0.1);
      this.updateZoomDisplay();
    });

    document.getElementById("zoom-out-btn")?.addEventListener("click", () => {
      const currentScale = this.graphPanZoom.getScale();
      this.graphPanZoom.setScale(currentScale - 0.1);
      this.updateZoomDisplay();
    });

    document.getElementById("zoom-reset-btn")?.addEventListener("click", () => {
      this.graphPanZoom.resetZoom();
      this.updateZoomDisplay();
    });

    document
      .getElementById("reset-layout-btn")
      ?.addEventListener("click", () => {
        this.graphRenderer.resetToAutoLayout();
        // Re-render the graph with auto layout
        if (this.state.currentTreeId) {
          const tree = this.state.trees[this.state.currentTreeId];
          if (tree) {
            this.renderGraph();
          }
        }
      });

    // Listen for reset layout event from GraphRenderer
    window.addEventListener("arbor-reset-layout", () => {
      if (this.state.currentTreeId) {
        const tree = this.state.trees[this.state.currentTreeId];
        if (tree) {
          this.renderGraph();
        }
      }
    });
  }

  private updateZoomDisplay() {
    const zoomLevel = document.getElementById("zoom-level");
    if (zoomLevel) {
      const scale = this.graphPanZoom.getScale();
      zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  private async refreshSidebar() {
    console.log("📋 [DRAG-DEBUG] REFRESH SIDEBAR START:", {
      currentTreeId: this.state.currentTreeId,
      treesCount: Object.keys(this.state.trees).length,
      currentTree: this.state.currentTreeId
        ? (() => {
            const treeId = this.state.currentTreeId!;
            const tree = this.state.trees[treeId];
            return {
              nodeCount: Object.keys(tree.nodes).length,
              structure: Object.keys(tree.nodes).map((id) => {
                const node = tree.nodes[id];
                return {
                  id,
                  parentId: node?.parentId || null,
                  children: node?.children || [],
                };
              }),
            };
          })()
        : null,
      timestamp: Date.now(),
    });

    const untrackedChats = this.getUntrackedChats();
    await this.uiInjector.injectSidebar(
      this.state.trees,
      this.state.currentTreeId,
      untrackedChats,
    );

    console.log("📋 [DRAG-DEBUG] REFRESH SIDEBAR COMPLETE - DOM state:", {
      sidebarExists: !!document.getElementById("arbor-sidebar-container"),
      treeNodesInDOM: document.querySelectorAll(".tree-node").length,
      timestamp: Date.now(),
    });
  }

  private getUntrackedChats(): AvailableChat[] {
    const trackedUrls = new Set<string>();

    Object.values(this.state.trees).forEach((tree) => {
      Object.values(tree.nodes).forEach((node) => {
        trackedUrls.add(node.url);
      });
    });

    return this.availableChats.filter((chat) => !trackedUrls.has(chat.url));
  }

  private attachGraphListeners() {
    // Add listeners for graph nodes after they're rendered
    setTimeout(() => {
      document.querySelectorAll(".graph-node").forEach((nodeEl) => {
        const nodeId = (nodeEl as HTMLElement).dataset.nodeId;
        if (!nodeId) return;

        // REMOVED: Old drag handler - now handled in GraphRenderer.makeDraggable
        // Click handler handled by GraphRenderer as well

        // Context menu
        nodeEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          const mouseEvent = e as MouseEvent;
          this.nodeInteractions.showContextMenu(
            nodeId,
            mouseEvent.clientX,
            mouseEvent.clientY,
            (action, id) => this.handleNodeAction(action, id),
          );
        });
      });
    }, 100);
  }

  private async handleNodeAction(action: string, nodeId: string) {
    if (!this.state.currentTreeId) return;

    const tree = this.state.trees[this.state.currentTreeId];
    const node = tree.nodes[nodeId];

    if (!node) return;

    switch (action) {
      case "rename":
        const newTitle = prompt("Enter new title:", node.title);
        if (newTitle) {
          await this.nodeManager.renameNode(
            nodeId,
            newTitle,
            tree,
            this.state.currentTreeId,
          );
          this.showNotification("Node renamed! ✏️", "success");
          this.refresh();
        }
        break;

      case "color":
        const color = prompt("Enter color (hex):", node.color || "#4a9eff");
        if (color) {
          await this.nodeManager.updateNodeColor(
            nodeId,
            color,
            tree,
            this.state.currentTreeId,
          );
          this.showNotification("Color updated! 🎨", "success");
          this.renderGraph();
        }
        break;

      case "shape":
        const shape = prompt(
          "Enter shape (circle, rounded, rectangle, diamond):",
          node.shape || "rounded",
        );
        if (shape) {
          await this.nodeManager.updateNodeShape(
            nodeId,
            shape,
            tree,
            this.state.currentTreeId,
          );
          this.showNotification("Shape updated! 🔷", "success");
          this.renderGraph();
        }
        break;

      case "label":
        if (node.parentId) {
          await this.handleConnectionLabelClick(nodeId, node.parentId);
        } else {
          this.showNotification("Root nodes have no connection label", "error");
        }
        break;

      case "reset":
        delete node.customPosition;
        await this.nodeManager.updateNodePosition(
          nodeId,
          { x: 0, y: 0 },
          tree,
          this.state.currentTreeId,
        );
        this.showNotification("Position reset! 📍", "success");
        this.renderGraph();
        break;

      case "delete":
        await this.deleteNodeFromTree(nodeId);
        break;
    }
  }

  private async handleSidebarAction(action: string, data?: any) {
    switch (action) {
      case "toggleGraph":
        this.uiInjector.toggleGraph();
        // Reinitialize pan/zoom when graph is toggled to visible
        setTimeout(() => {
          const graph = document.getElementById("arbor-graph-container");
          if (graph && !graph.classList.contains("hidden")) {
            this.graphPanZoom.init();
            this.graphPanZoom.setOnScaleChange(() => this.updateZoomDisplay());
            this.updateZoomDisplay();
          }
        }, 100);
        break;
      case "newChat":
        await this.createNewChat();
        break;
      case "newTree":
        await this.createNewTree();
        break;
      case "createBranch":
        await this.showBranchDialog();
        break;
      case "selectTree":
        await this.selectTree(data);
        break;
      case "addChatToTree":
        await this.addChatToTree(data); // data is now chatUrl
        break;
      case "editTreeName":
        await this.editTreeName();
        break;
      case "deleteTree":
        await this.deleteTree();
        break;
      case "deleteNode":
        await this.deleteNodeFromTree(data);
        break;
      case "navigateToNode":
        await this.handleNodeClick(data);
        break;
      case "reparentNode":
        if (data?.nodeId && data?.newParentId && this.state.currentTreeId) {
          console.log("📥 [DRAG-DEBUG] REPARENT ACTION RECEIVED:", {
            nodeId: data.nodeId,
            newParentId: data.newParentId,
            currentTreeId: this.state.currentTreeId,
            sidebarNodeCount: document.querySelectorAll(`[data-node-id="${data.nodeId}"]`).length,
            graphNodeCount: document.querySelectorAll(`.graph-node[data-node-id="${data.nodeId}"]`).length,
            timestamp: Date.now(),
          });

          const tree = this.state.trees[this.state.currentTreeId];
          const success = await this.nodeManager.reparentNode(
            data.nodeId,
            data.newParentId,
            tree,
            this.state.currentTreeId,
          );
          if (success) {
            console.log("✅ [DRAG-DEBUG] REPARENT SUCCESS - Triggering refresh");
            this.showNotification("Node reparented! 🔄", "success");
            this.refresh();
            console.log("🔄 [DRAG-DEBUG] REFRESH COMPLETE - Checking DOM:", {
              sidebarNodeCount: document.querySelectorAll(`[data-node-id="${data.nodeId}"]`).length,
              graphNodeCount: document.querySelectorAll(`.graph-node[data-node-id="${data.nodeId}"]`).length,
              timestamp: Date.now(),
            });
          } else {
            console.log("❌ [DRAG-DEBUG] REPARENT FAILED");
            this.showNotification(
              "Cannot reparent node (would create cycle or invalid structure)",
              "error",
            );
          }
        }
        break;
      case "renameNode":
        if (data?.nodeId && data?.newName && this.state.currentTreeId) {
          await this.renameNode(data.nodeId, data.newName);
        }
        break;
      case "renameTree":
        if (data?.treeId && data?.newName) {
          await this.renameTreeById(data.treeId, data.newName);
        }
        break;
    }
  }

  private async createNewTree() {
    const name = prompt("Enter tree name:");
    if (!name) return;

    const tree = await this.treeManager.createTree(name, this.platform);
    this.state.trees[tree.id] = tree;
    this.state.currentTreeId = tree.id;
    this.state.currentNodeId = tree.rootNodeId;

    await this.saveState();
    this.showNotification(`Tree "${name}" created! 🌳`, "success");
    this.refresh();
  }

  private async createNewChat() {
    const url = this.platform === "chatgpt" ? "https://chatgpt.com/" : "";
    if (url) {
      window.location.href = url;
    }
  }

  private async showBranchDialog() {
    // Check if we're on a chat page
    const currentChat = this.chatDetector.detectCurrentChat();
    if (!currentChat) {
      this.showNotification(
        "You must be on a ChatGPT conversation page to create a branch",
        "error",
      );
      return;
    }

    // Show branch configuration dialog
    const config = await BranchConnectionTypeDialog.show("extends");

    if (!config) {
      // User cancelled
      return;
    }

    // Proceed with branch creation using selected configuration
    await this.createBranch(config);
  }

  private async createBranch(config: BranchDialogResult) {
    // Get the current chat from the page (not from selected tree node)
    const currentChat = this.chatDetector.detectCurrentChat();
    if (!currentChat) {
      this.showNotification(
        "You must be on a ChatGPT conversation page to create a branch",
        "error",
      );
      return;
    }

    // Use the current page's chat title (more robust method from platform)
    const platformAdapter = PlatformFactory.getActivePlatform();
    const currentTitle = platformAdapter
      ? platformAdapter.detectChatTitle() || currentChat.title
      : currentChat.title;

    // Show initial loading notification
    const loadingNotification = this.showLoadingNotification(
      "Extracting messages...",
    );

    try {
      // Update progress
      this.updateLoadingNotification(
        loadingNotification,
        "Preparing context...",
      );

      // Create branch context using the BranchContextManager with user-selected configuration
      // Messages will be extracted from the current page, title from current page
      let progressCallback: ((message: string) => void) | undefined;
      if (config.formatType === "summary") {
        progressCallback = (message: string) => {
          this.updateLoadingNotification(loadingNotification, message);
        };
      }

      const branchManager = await this.getBranchContextManager();
      const result = await branchManager.createBranchContext({
        parentTitle: currentTitle,
        connectionType: config.connectionType,
        formatType: config.formatType,
        messageLength: config.messageLength,
        messageCount: config.messageCount || 10,
        customConnectionType: config.customConnectionType,
        customPrompt: config.customPrompt,
        progressCallback,
      });

      // Remove loading notification
      loadingNotification.remove();

      if (!result.success) {
        // Use error message utility for user-friendly errors
        const errorMessage = formatErrorForUI(result.error);

        // If clipboard copy failed, show the context in an alert as fallback
        if (result.context) {
          alert(`Context (copy manually):\n\n${result.context}`);
        } else {
          // Provide user-friendly error message with suggestion
          const isApiError =
            errorMessage.toLowerCase().includes("api") ||
            errorMessage.toLowerCase().includes("key") ||
            errorMessage.toLowerCase().includes("gemini");
          if (isApiError) {
            this.showNotification(
              "Unable to connect to AI service. Try using 'Smart' or 'Full History' format instead.",
              "error",
            );
          } else {
            this.showNotification(
              `Couldn't create branch: ${errorMessage}`,
              "error",
            );
          }
        }
        return;
      }

      // Get the current chat node ID if it exists in the tree
      let parentNodeId: string | undefined;
      let parentTreeId: string | undefined;

      if (this.state.currentTreeId) {
        const tree = this.state.trees[this.state.currentTreeId];
        if (tree) {
          parentTreeId = this.state.currentTreeId;
          // Find the node that matches the current chat URL
          const platformAdapter = PlatformFactory.getActivePlatform();
          const currentChatUrl = platformAdapter
            ? platformAdapter.detectCurrentChatUrl()
            : currentChat.url;

          if (currentChatUrl) {
            const matchingNode = Object.values(tree.nodes).find(
              (node) => node.url === currentChatUrl,
            );
            if (matchingNode) {
              parentNodeId = matchingNode.id;
            }
          }
        }
      }

      // Show success notification
      this.showNotification(
        "✓ Branch created! Opening new chat with conversation context...",
        "success",
      );

      // Open new chat with context and parent info
      setTimeout(() => {
        branchManager.openNewChat(result.context, parentNodeId, parentTreeId);
      }, 1000);
    } catch (error) {
      // Remove loading notification on error
      loadingNotification.remove();

      // Use error message utility for user-friendly errors
      const errorMessage = formatErrorForUI(error);
      this.showNotification(
        `Failed to create branch context: ${errorMessage}`,
        "error",
      );
    }
  }

  private async selectTree(treeId: string) {
    if (!this.state.trees[treeId]) return;

    this.state.currentTreeId = treeId;
    this.state.currentNodeId = this.state.trees[treeId].rootNodeId;

    await this.saveState();
    // Ensure graph is shown before rendering
    this.uiInjector.showGraph();
    this.refresh();
  }

  private async editTreeName() {
    if (!this.state.currentTreeId) {
      this.showNotification("No tree selected", "error");
      return;
    }

    const tree = this.state.trees[this.state.currentTreeId];
    if (!tree) return;

    const newName = prompt("Enter new tree name:", tree.name || "Unnamed Tree");
    if (!newName || newName.trim() === "") return;

    await this.treeManager.renameTree(
      this.state.currentTreeId,
      newName.trim(),
      this.state.trees,
    );

    await this.saveState();
    this.showNotification(`Tree renamed to "${newName}"! ✏️`, "success");
    this.refresh();
  }

  private async renameNode(nodeId: string, newName: string) {
    if (!this.state.currentTreeId) {
      this.showNotification("No tree selected", "error");
      return;
    }

    const tree = this.state.trees[this.state.currentTreeId];
    if (!tree || !tree.nodes[nodeId]) {
      this.showNotification("Node not found", "error");
      return;
    }

    tree.nodes[nodeId].title = newName.trim();
    tree.nodes[nodeId].updatedAt = new Date().toISOString();
    tree.updatedAt = new Date().toISOString();

    await db.saveNode(tree.nodes[nodeId], this.state.currentTreeId);
    await db.saveTree(tree);
    await this.saveState();

    this.showNotification(`Node renamed! ✏️`, "success");
    this.refresh();
  }

  private async renameTreeById(treeId: string, newName: string) {
    const tree = this.state.trees[treeId];
    if (!tree) {
      this.showNotification("Tree not found", "error");
      return;
    }

    await this.treeManager.renameTree(treeId, newName.trim(), this.state.trees);
    await this.saveState();

    this.showNotification(`Tree renamed to "${newName}"! ✏️`, "success");
    this.refresh();
  }

  private async deleteTree() {
    if (!this.state.currentTreeId) {
      this.showNotification("No tree selected", "error");
      return;
    }

    const tree = this.state.trees[this.state.currentTreeId];
    if (!tree) {
      this.showNotification("Tree not found", "error");
      return;
    }

    const treeName = tree.name || "Unnamed Tree";
    const nodeCount = Object.keys(tree.nodes).length;

    if (
      !confirm(
        `Delete "${treeName}"?\n\nThis will permanently delete:\n• The entire tree\n• All ${nodeCount} node${
          nodeCount !== 1 ? "s" : ""
        } and their connections\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    const result = await this.treeManager.deleteTree(
      this.state.currentTreeId,
      this.state.trees,
    );

    if (!result.success) {
      this.showNotification(
        `Failed to delete tree: ${result.error || "Unknown error"}`,
        "error",
      );
      return;
    }

    // Update state to next tree or clear if none
    this.state.currentTreeId = result.nextTreeId;
    this.state.currentNodeId = result.nextTreeId
      ? this.state.trees[result.nextTreeId]?.rootNodeId || null
      : null;

    await this.saveState();
    this.showNotification(`Tree "${treeName}" deleted! 🗑️`, "success");
    this.refresh();
  }

  private async deleteNodeFromTree(nodeId: string) {
    if (!this.state.currentTreeId) {
      this.showNotification("No tree selected", "error");
      return;
    }

    const tree = this.state.trees[this.state.currentTreeId];
    const node = tree?.nodes[nodeId];

    if (!node) {
      this.showNotification("Node not found", "error");
      return;
    }

    // Prevent deleting root node
    if (nodeId === tree.rootNodeId) {
      this.showNotification(
        "Cannot delete root node! Delete the tree instead.",
        "error",
      );
      return;
    }

    // Count descendants
    const countDescendants = (id: string): number => {
      const n = tree.nodes[id];
      if (!n) return 0;
      let count = 1; // Count self
      for (const childId of n.children) {
        count += countDescendants(childId);
      }
      return count;
    };

    const descendantCount = countDescendants(nodeId);
    const willDeleteCount =
      descendantCount > 1 ? `${descendantCount} nodes` : "1 node";

    if (
      !confirm(
        `Delete "${node.title}"?\n\nThis will permanently delete:\n• ${willDeleteCount} (including all children)\n• All connections to this branch\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    const result = await this.nodeManager.deleteNode(
      nodeId,
      tree,
      this.state.currentTreeId,
    );

    if (!result.success) {
      this.showNotification(
        `Failed to delete node: ${result.error || "Unknown error"}`,
        "error",
      );
      return;
    }

    // Update current node if it was deleted
    if (this.state.currentNodeId === nodeId) {
      this.state.currentNodeId = tree.rootNodeId;
      await this.saveState();
    }

    this.showNotification("Node deleted! 🗑️", "success");
    this.refresh();
  }

  private async addChatToTree(chatUrl: string, parentNodeId?: string | null) {
    if (!this.state.currentTreeId) {
      this.showNotification("No active tree selected", "error");
      return;
    }

    // Find the chat by URL in availableChats
    const chat = this.availableChats.find((c) => c.url === chatUrl);
    if (!chat) {
      this.showNotification("Chat not found", "error");
      return;
    }

    // Check if chat is already tracked
    const untrackedChats = this.getUntrackedChats();
    const isUntracked = untrackedChats.some((c) => c.url === chatUrl);
    if (!isUntracked) {
      this.showNotification("This chat is already in a tree", "error");
      return;
    }

    const tree = this.state.trees[this.state.currentTreeId];

    // Use provided parentNodeId, or default to root
    const targetParentId = parentNodeId || tree.rootNodeId;

    await this.nodeManager.createNode(
      targetParentId,
      chat.title,
      chat.url,
      chat.platform,
      tree,
      this.state.currentTreeId,
    );

    this.showNotification(`Added "${chat.title}" to tree! ✅`, "success");
    this.refresh();
    this.renderGraph();
  }

  /**
   * Handle auto-pasting context and adding new chat to tree after branch creation
   */
  private async handleAutoPasteAndTreeAddition() {
    try {
      // Check if we have stored context from branch creation (using secure chrome.storage.session)
      const data = await chrome.storage.session.get([
        "arbor_branch_context",
        "arbor_branch_parent_node_id",
        "arbor_branch_parent_tree_id",
        "arbor_branch_timestamp",
      ]);

      const context = data.arbor_branch_context;
      const parentNodeId = data.arbor_branch_parent_node_id;
      const parentTreeId = data.arbor_branch_parent_tree_id;
      const timestamp = data.arbor_branch_timestamp;

      if (!context || !timestamp) {
        return; // No branch context to handle
      }

      // Check if this is a recent branch creation (within last 5 minutes)
      const branchTime = parseInt(timestamp, 10);
      const now = Date.now();
      if (now - branchTime > 5 * 60 * 1000) {
        // Too old, clear it
        this.clearBranchContext();
        return;
      }

      // If we're on the home page (new chat), paste the context
      const platformAdapter = PlatformFactory.getActivePlatform();
      if (platformAdapter && !platformAdapter.isInConversation()) {
        // Wait a bit for the page to fully load
        setTimeout(async () => {
          const pasted = await platformAdapter.pasteIntoInput(context);
          if (pasted) {
            console.log("🌳 Arbor: Context pasted successfully");
            this.showNotification(
              "Context added! The AI now has your conversation history. Continue chatting →",
              "success",
            );
          } else {
            console.warn(
              "🌳 Arbor: Failed to paste context, user will need to paste manually",
            );
            // Detect OS for keyboard shortcut
            const pasteKey = navigator.platform.includes("Mac")
              ? "⌘V"
              : "Ctrl+V";
            this.showNotification(
              `Context copied! Paste it into the new chat (${pasteKey}) to continue`,
              "info",
            );
          }
        }, 1000);
        // Navigation listener will handle adding to tree when chat is created
      } else if (platformAdapter && platformAdapter.isInConversation()) {
        // We're already in a conversation - this might be the new chat
        // Wait a bit and then add it to the tree
        setTimeout(async () => {
          await this.addNewChatToTreeIfNeeded(parentNodeId, parentTreeId);
        }, 2000);
      }
    } catch (error) {
      console.error("🌳 Arbor: Error handling auto-paste:", error);
    }
  }

  /**
   * Add the current chat to the tree if it's not already there
   */
  private async addNewChatToTreeIfNeeded(
    parentNodeId: string | null,
    parentTreeId: string | null,
  ) {
    try {
      if (!parentNodeId || !parentTreeId) {
        this.clearBranchContext();
        return;
      }

      // Get current chat URL
      const platformAdapter = PlatformFactory.getActivePlatform();
      const currentChatUrl = platformAdapter
        ? platformAdapter.detectCurrentChatUrl()
        : window.location.href;

      if (!currentChatUrl) {
        return;
      }

      // Check if we need to switch to the parent tree
      if (this.state.currentTreeId !== parentTreeId) {
        this.state.currentTreeId = parentTreeId;
        await this.saveState();
      }

      // Check if this chat is already in the tree
      const tree = this.state.trees[parentTreeId];
      if (!tree) {
        console.warn("🌳 Arbor: Parent tree not found");
        this.clearBranchContext();
        return;
      }

      const existingNode = Object.values(tree.nodes).find(
        (node) => node.url === currentChatUrl,
      );

      if (existingNode) {
        // Chat is already in the tree
        console.log("🌳 Arbor: Chat already in tree");
        this.clearBranchContext();
        return;
      }

      // Get chat title
      const chatTitle = platformAdapter
        ? platformAdapter.detectChatTitle() || "New Branch"
        : "New Branch";

      // Add the chat to the tree as a child of the parent
      await this.nodeManager.createNode(
        parentNodeId,
        chatTitle,
        currentChatUrl,
        this.platform,
        tree,
        parentTreeId,
      );

      this.showNotification(
        `Branch "${chatTitle}" added to tree! 🌿`,
        "success",
      );
      this.refresh();
      this.renderGraph();
      this.clearBranchContext();
    } catch (error) {
      console.error("🌳 Arbor: Error adding new chat to tree:", error);
      this.clearBranchContext();
    }
  }

  /**
   * Clear stored branch context from chrome.storage.session
   */
  private clearBranchContext() {
    chrome.storage.session
      .remove([
        "arbor_branch_context",
        "arbor_branch_parent_node_id",
        "arbor_branch_parent_tree_id",
        "arbor_branch_timestamp",
      ])
      .catch((error) => {
        console.error("Failed to clear branch context:", error);
      });
  }

  private async handleNodeClick(nodeId: string) {
    if (!this.state.currentTreeId) return;

    const tree = this.state.trees[this.state.currentTreeId];
    const node = tree?.nodes[nodeId];

    if (node) {
      window.location.href = node.url;
    }
  }

  private async handleConnectionLabelClick(childId: string, parentId: string) {
    if (!this.state.currentTreeId) return;

    const tree = this.state.trees[this.state.currentTreeId];
    await this.connectionLabels.editConnectionLabel(
      childId,
      parentId,
      tree,
      this.state.currentTreeId,
      (parentTitle, childTitle) => {
        this.showNotification(
          `Label updated: ${parentTitle} → ${childTitle}`,
          "success",
        );
        this.renderGraph();
      },
    );
  }

  private renderGraph() {
    // Mark as dirty for potential re-render
    this.isDirty = true;

    // Debounce render calls (150ms)
    if (this.renderDebounceTimer !== null) {
      return; // Already scheduled
    }

    this.renderDebounceTimer = window.setTimeout(() => {
      this.renderDebounceTimer = null;
      this.performRender();
    }, 150);
  }

  private performRender() {
    if (!this.state.currentTreeId) {
      this.uiInjector.hideGraph();
      this.isDirty = false;
      return;
    }

    const tree = this.state.trees[this.state.currentTreeId];
    if (!tree) {
      this.uiInjector.hideGraph();
      this.isDirty = false;
      return;
    }

    // Skip render if not dirty and same tree
    if (!this.isDirty && this.lastRenderedTreeId === this.state.currentTreeId) {
      return;
    }

    this.isDirty = false;
    this.lastRenderedTreeId = this.state.currentTreeId;

    // Ensure graph container exists
    const graphContainer = document.getElementById("arbor-graph-container");
    if (!graphContainer) {
      this.uiInjector.injectGraphView();
    }

    // Ensure graph container is visible before rendering
    this.uiInjector.showGraph();

    // Small delay to ensure DOM is ready
    setTimeout(async () => {
      const content = document.getElementById("graph-content");
      if (!content) {
        console.warn("Graph content container not found, retrying...");
        setTimeout(() => this.performRender(), 100);
        return;
      }

      await this.graphRenderer.setCurrentTree(this.state.currentTreeId);
      this.graphRenderer.setCurrentNode(this.state.currentNodeId);
      this.graphRenderer.renderGraph(tree);

      // Reinitialize pan/zoom after graph is rendered
      this.graphPanZoom.init();
      this.graphPanZoom.setOnScaleChange(() => this.updateZoomDisplay());
      this.graphPanZoom.applyScale();
      this.updateZoomDisplay();

      // Reattach listeners after render
      this.attachGraphListeners();
    }, 50);
  }

  private async scanAvailableChats() {
    this.availableChats = await this.chatDetector.scanAvailableChats();

    if (this.sidebarInjected) {
      this.refreshSidebar();
    }
  }

  private detectAndTrackCurrentChat() {
    const currentChat = this.chatDetector.detectCurrentChat();

    if (currentChat && this.state.currentTreeId) {
      const tree = this.state.trees[this.state.currentTreeId];
      const existingNode = Object.values(tree.nodes).find(
        (node) => node.url === currentChat.url,
      );

      if (existingNode) {
        this.state.currentNodeId = existingNode.id;
      }
    }
  }

  private refresh() {
    console.log("🔄 [DRAG-DEBUG] REFRESH START:", {
      currentTreeId: this.state.currentTreeId,
      treeNodeCount: this.state.currentTreeId
        ? Object.keys(this.state.trees[this.state.currentTreeId].nodes).length
        : 0,
      timestamp: Date.now(),
    });
    this.refreshSidebar();
    console.log("🔄 [DRAG-DEBUG] SIDEBAR REFRESHED");
    this.renderGraph();
    console.log("🔄 [DRAG-DEBUG] GRAPH RENDERED");
  }

  private showNotification(
    message: string,
    type: "success" | "error" | "info",
  ) {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Simple toast notification
    const toast = document.createElement("div");
    const backgroundColor =
      type === "success" ? "#2dd4a7" : type === "error" ? "#ef4444" : "#3b82f6"; // blue for info
    const textColor = type === "success" ? "#0c0f0e" : "#fff"; // white for error and info

    toast.style.cssText = `
        position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${backgroundColor};
      color: ${textColor};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 99999999;
              font-size: 14px;
      font-weight: 600;
      animation: slideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Show loading notification with spinner
   */
  private showLoadingNotification(message: string): HTMLElement {
    const toast = document.createElement("div");
    toast.id = "arbor-loading-notification";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: #3b82f6;
      color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 99999999;
      font-size: 14px;
      font-weight: 600;
      animation: slideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const spinner = document.createElement("div");
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    const text = document.createElement("span");
    text.textContent = message;

    toast.appendChild(spinner);
    toast.appendChild(text);

    // Add spin animation if not already added
    if (!document.getElementById("arbor-spinner-style")) {
      const style = document.createElement("style");
      style.id = "arbor-spinner-style";
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    return toast;
  }

  /**
   * Update loading notification message
   */
  private updateLoadingNotification(
    toast: HTMLElement,
    newMessage: string,
  ): void {
    const textElement = toast.querySelector("span");
    if (textElement) {
      textElement.textContent = newMessage;
    }
  }

  /**
   * Cleanup all resources and event listeners
   * Call this when the extension is being unloaded
   */
  public cleanup(): void {
    // Run all cleanup functions
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];

    // Cleanup branch context manager if it was loaded
    if (
      this.branchContextManager &&
      typeof this.branchContextManager.cleanup === "function"
    ) {
      this.branchContextManager.cleanup();
    }

    // Cleanup platform-specific resources
    const platformAdapter = PlatformFactory.getActivePlatform();
    if (platformAdapter) {
      platformAdapter.cleanup();
    }

    console.log("🌳 Arbor: Cleanup complete");
  }
}

// Initialize extension
console.log(
  `🌳 Arbor: Content script loaded! Checking platform on hostname: ${window.location.hostname}`,
);
console.log(`🌳 Arbor: Full URL: ${window.location.href}`);
console.log(`🌳 Arbor: Document ready state: ${document.readyState}`);

const platform = detectPlatform();
if (platform) {
  console.log(`🌳 Arbor: ✅ Platform detected: ${platform}`);
  try {
    new ArborExtension(platform);
    console.log(`🌳 Arbor: ✅ Extension initialized successfully`);
  } catch (error) {
    console.error(`🌳 Arbor: ❌ Failed to initialize extension:`, error);
  }
} else {
  console.error(
    `🌳 Arbor: ❌ Platform not supported on ${window.location.hostname}`,
  );
  console.log(
    "🌳 Arbor: Available platforms: chatgpt, gemini, claude, perplexity",
  );
}
