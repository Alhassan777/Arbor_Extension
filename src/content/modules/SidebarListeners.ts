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
      node.addEventListener("click", (e) => {
        // Don't navigate if clicking on delete button
        const target = e.target as HTMLElement;
        if (target.classList.contains("delete-node-btn") || target.closest(".delete-node-btn")) {
          return;
        }

        const nodeId = (node as HTMLElement).dataset.nodeId;
        if (nodeId) {
          this.onSidebarAction("navigateToNode", nodeId);
        }
      });
    });
  }
}
