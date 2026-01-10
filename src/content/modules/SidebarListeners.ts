/**
 * SidebarListeners - Handles sidebar event listeners
 */

export class SidebarListeners {
  private onSidebarAction: (action: string, data?: any) => void;
  private onToggleSidebar: () => void;

  constructor(
    onSidebarAction: (action: string, data?: any) => void,
    onToggleSidebar: () => void
  ) {
    this.onSidebarAction = onSidebarAction;
    this.onToggleSidebar = onToggleSidebar;
  }

  attach() {
    // Close Sidebar button (header)
    document
      .getElementById("close-sidebar-btn")
      ?.addEventListener("click", () => {
        this.onToggleSidebar();
      });

    // New Chat button
    document.getElementById("new-chat-btn")?.addEventListener("click", () => {
      this.onSidebarAction("newChat");
    });

    // New Tree button
    document.getElementById("new-tree")?.addEventListener("click", () => {
      this.onSidebarAction("newTree");
    });

    // Branch button
    document.getElementById("create-branch")?.addEventListener("click", () => {
      this.onSidebarAction("createBranch");
    });

    // Tree selection
    document.querySelectorAll(".tree-item").forEach((item) => {
      item.addEventListener("click", () => {
        const treeId = (item as HTMLElement).dataset.treeId;
        this.onSidebarAction("selectTree", treeId);
      });
    });

    // Untracked chat selection
    document.querySelectorAll(".untracked-chat-item").forEach((item) => {
      const chatUrl = (item as HTMLElement).dataset.chatUrl;
      const chatIndex = (item as HTMLElement).dataset.chatIndex;

      item.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("add-to-tree-btn")) {
          // Use chat URL instead of index to ensure correct chat is added
          this.onSidebarAction("addChatToTree", chatUrl);
        } else if (chatUrl) {
          window.location.href = chatUrl;
        }
      });
    });

    // Edit tree name button
    document.getElementById("tree-title-editable")?.addEventListener("click", () => {
      this.onSidebarAction("editTreeName");
    });

    // Delete tree button
    document.getElementById("tree-delete-btn")?.addEventListener("click", () => {
      this.onSidebarAction("deleteTree");
    });

    // Delete node buttons (in sidebar tree view)
    document.querySelectorAll(".delete-node-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering node click
        const nodeId = (btn as HTMLElement).dataset.nodeId;
        if (nodeId) {
          this.onSidebarAction("deleteNode", nodeId);
        }
      });
    });

    // Tree node click handlers (for navigation)
    document.querySelectorAll(".tree-node").forEach((node) => {
      const nodeEl = node as HTMLElement;
      const nodeId = nodeEl.dataset.nodeId;
      if (!nodeId) return;

      let hasDragged = false;

      // Drag start
      nodeEl.addEventListener("dragstart", (e) => {
        if (!nodeEl.draggable) return;
        if (!e.dataTransfer) return;
        
        hasDragged = false;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/arbor-node-id", nodeId);
        nodeEl.style.opacity = "0.5";
        nodeEl.style.cursor = "grabbing";
        
        // Set flag after a short delay to allow drag to start
        setTimeout(() => {
          hasDragged = true;
        }, 10);
      });

      // Drag end
      nodeEl.addEventListener("dragend", (e) => {
        const wasDragging = hasDragged;
        nodeEl.style.opacity = "1";
        nodeEl.style.cursor = "grab";
        
        // Remove drop target highlighting from all nodes
        document.querySelectorAll(".tree-node").forEach((n) => {
          (n as HTMLElement).style.background = "";
          (n as HTMLElement).style.borderLeft = "3px solid #2dd4a7";
        });

        // Reset flag after drag ends (small delay to prevent click)
        setTimeout(() => {
          hasDragged = false;
        }, wasDragging ? 100 : 0);
      });

      // Drag over (for drop target)
      nodeEl.addEventListener("dragover", (e) => {
        if (!e.dataTransfer) return;
        
        // Check if this is an arbor node drag
        if (!e.dataTransfer.types.includes("application/arbor-node-id")) {
          return;
        }

        // All tree nodes can be drop targets (including root nodes)
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        
        // Highlight as drop target
        nodeEl.style.background = "rgba(45, 212, 167, 0.2)";
        nodeEl.style.borderLeft = "3px solid #2dd4a7";
      });

      // Drag leave
      nodeEl.addEventListener("dragleave", (e) => {
        // Only remove highlight if we're actually leaving this element
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!nodeEl.contains(relatedTarget)) {
          nodeEl.style.background = "";
          nodeEl.style.borderLeft = "3px solid #2dd4a7";
        }
      });

      // Drop
      nodeEl.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!e.dataTransfer) return;

        const draggedNodeId = e.dataTransfer.getData("application/arbor-node-id");
        if (!draggedNodeId || draggedNodeId === nodeId) {
          return;
        }

        // Remove highlight
        nodeEl.style.background = "";
        nodeEl.style.borderLeft = "3px solid #2dd4a7";

        // Trigger reparent action
        this.onSidebarAction("reparentNode", {
          nodeId: draggedNodeId,
          newParentId: nodeId,
        });
      });

      // Click handler (for navigation) - only if not dragging
      nodeEl.addEventListener("click", (e) => {
        // Don't navigate if clicking on delete button
        const target = e.target as HTMLElement;
        if (target.classList.contains("delete-node-btn") || target.closest(".delete-node-btn")) {
          return;
        }

        // Don't navigate if we just dragged
        if (hasDragged) {
          return;
        }

        if (nodeId) {
          this.onSidebarAction("navigateToNode", nodeId);
        }
      });
    });
  }
}
