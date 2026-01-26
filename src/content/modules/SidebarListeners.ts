/**
 * SidebarListeners - Handles sidebar event listeners
 */

export class SidebarListeners {
  private onSidebarAction: (action: string, data?: any) => void;
  private onToggleSidebar: () => void;
  private abortController: AbortController | null = null;

  // Element cache for frequently accessed elements
  private elementCache: Map<string, HTMLElement | null> = new Map();

  // Drag state management - per node
  private dragState: Map<string, { hasDragged: boolean; isDragging: boolean }> =
    new Map();

  // Collapse state management - prevent edit mode immediately after collapse/expand
  private collapseState: Map<string, { justToggled: boolean }> = new Map();

  constructor(
    onSidebarAction: (action: string, data?: any) => void,
    onToggleSidebar: () => void,
  ) {
    this.onSidebarAction = onSidebarAction;
    this.onToggleSidebar = onToggleSidebar;
  }

  private getElement(id: string): HTMLElement | null {
    if (!this.elementCache.has(id)) {
      this.elementCache.set(id, document.getElementById(id));
    }
    return this.elementCache.get(id) || null;
  }

  private clearCache() {
    this.elementCache.clear();
  }

  detach() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.clearCache();
    this.dragState.clear();
    this.collapseState.clear();
  }

  attach() {
    // Detach any existing listeners first
    this.detach();

    // Create new AbortController for this attachment
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Close Sidebar button (header) - using cache
    this.getElement("close-sidebar-btn")?.addEventListener(
      "click",
      () => {
        this.onToggleSidebar();
      },
      { signal },
    );

    // New Chat button - using cache
    this.getElement("new-chat-btn")?.addEventListener(
      "click",
      () => {
        this.onSidebarAction("newChat");
      },
      { signal },
    );

    // New Tree button - using cache
    this.getElement("new-tree")?.addEventListener(
      "click",
      () => {
        this.onSidebarAction("newTree");
      },
      { signal },
    );

    // Branch button - using cache
    this.getElement("create-branch")?.addEventListener(
      "click",
      () => {
        this.onSidebarAction("createBranch");
      },
      { signal },
    );

    // Tree dropdown toggle
    this.attachTreeDropdownListeners();

    // Collapsible sections
    this.attachCollapsibleListeners();

    // Tree node collapse/expand buttons
    this.attachNodeCollapseListeners();

    // Untracked chat selection
    document.querySelectorAll(".arbor-untracked-item").forEach((item) => {
      const chatUrl = (item as HTMLElement).dataset.chatUrl;
      const chatIndex = (item as HTMLElement).dataset.chatIndex;

      item.addEventListener(
        "click",
        (e) => {
          const target = e.target as HTMLElement;
          if (
            target.classList.contains("add-to-tree-btn") ||
            target.closest(".add-to-tree-btn")
          ) {
            e.stopPropagation(); // Prevent triggering parent click
            // Use chat URL instead of index to ensure correct chat is added
            this.onSidebarAction("addChatToTree", chatUrl);
          } else if (chatUrl) {
            window.location.href = chatUrl;
          }
        },
        { signal },
      );

      // Keyboard support for untracked items
      item.addEventListener(
        "keydown",
        (e: Event) => {
          const keyEvent = e as KeyboardEvent;
          if (keyEvent.key === "Enter" || keyEvent.key === " ") {
            keyEvent.preventDefault();
            if (chatUrl) {
              window.location.href = chatUrl;
            }
          } else if (keyEvent.key === "a" || keyEvent.key === "+") {
            keyEvent.preventDefault();
            // Add to tree with keyboard shortcut
            this.onSidebarAction("addChatToTree", chatUrl);
          }
        },
        { signal },
      );
    });

    // Edit tree name button
    document.getElementById("tree-title-editable")?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        this.onSidebarAction("editTreeName");
      },
      { signal },
    );

    // Delete tree button
    document.getElementById("delete-tree-btn")?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        this.showDeleteTreeConfirmation();
      },
      { signal },
    );

    // Open graph window button
    document.getElementById("open-graph-window-btn")?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        this.onSidebarAction("openGraphWindow");
      },
      { signal },
    );

    // Delete node buttons (in sidebar tree view)
    document.querySelectorAll(".delete-node-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering node click
        const nodeId = (btn as HTMLElement).dataset.nodeId;
        if (nodeId) {
          this.showDeleteNodeConfirmation(nodeId);
        }
      });
    });

    // Edit node button
    document.querySelectorAll(".edit-node-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering node click
        e.stopImmediatePropagation(); // Prevent other handlers
        const nodeId = (btn as HTMLElement).dataset.nodeId;
        if (nodeId) {
          // Don't allow edit if collapse/expand was just toggled
          const collapseState = this.collapseState.get(nodeId);
          if (collapseState?.justToggled) {
            return;
          }

          const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
          const titleEl = nodeEl?.querySelector(
            ".tree-node-title",
          ) as HTMLElement;
          if (titleEl) {
            this.enableInlineEdit(titleEl, nodeId, "node");
          }
        }
      });
    });

    // Tree node card click handlers (for navigation) - using new card class
    const treeNodeSelector = ".tree-node-card, .tree-node";
    document.querySelectorAll(treeNodeSelector).forEach((node) => {
      const nodeEl = node as HTMLElement;
      const nodeId = nodeEl.dataset.nodeId;
      if (!nodeId) return;

      // Initialize drag state for this node
      this.dragState.set(nodeId, { hasDragged: false, isDragging: false });

      // Make element draggable
      nodeEl.draggable = true;
      nodeEl.classList.add("draggable");

      // Drag start
      nodeEl.addEventListener(
        "dragstart",
        (e) => {
          if (!e.dataTransfer) return;

          const state = this.dragState.get(nodeId);
          if (state) {
            state.isDragging = true;
            state.hasDragged = false;
          }

          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("application/arbor-node-id", nodeId);
          nodeEl.style.opacity = "0.5";
          nodeEl.classList.add("dragging");

          // Mark as dragged after a threshold to distinguish from accidental drags
          requestAnimationFrame(() => {
            const state = this.dragState.get(nodeId);
            if (state && state.isDragging) {
              state.hasDragged = true;
            }
          });
        },
        { signal },
      );

      // Drag end
      nodeEl.addEventListener(
        "dragend",
        (e) => {
          const state = this.dragState.get(nodeId);
          const wasDragging = state?.hasDragged || false;

          nodeEl.style.opacity = "1";
          nodeEl.classList.remove("dragging");

          // Remove drop target highlighting from all nodes
          document
            .querySelectorAll(".tree-node, .tree-node-card")
            .forEach((n) => {
              (n as HTMLElement).classList.remove("drag-over");
            });

          if (state) {
            state.isDragging = false;

            // Keep hasDragged flag briefly to prevent unwanted click
            if (wasDragging) {
              setTimeout(() => {
                const currentState = this.dragState.get(nodeId);
                if (currentState) {
                  currentState.hasDragged = false;
                }
              }, 150);
            } else {
              state.hasDragged = false;
            }
          }
        },
        { signal },
      );

      // Drag over (for drop target)
      nodeEl.addEventListener(
        "dragover",
        (e) => {
          if (!e.dataTransfer) return;

          // Check if this is an arbor node drag
          if (!e.dataTransfer.types.includes("application/arbor-node-id")) {
            return;
          }

          // All tree nodes can be drop targets (we'll check for self-drop in the drop handler)
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";

          // Highlight as drop target
          nodeEl.classList.add("drag-over");
        },
        { signal },
      );

      // Drag leave
      nodeEl.addEventListener(
        "dragleave",
        (e) => {
          // Only remove highlight if we're actually leaving this element
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (!nodeEl.contains(relatedTarget)) {
            nodeEl.classList.remove("drag-over");
          }
        },
        { signal },
      );

      // Drop
      nodeEl.addEventListener(
        "drop",
        (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!e.dataTransfer) return;

          const draggedNodeId = e.dataTransfer.getData(
            "application/arbor-node-id",
          );
          if (!draggedNodeId || draggedNodeId === nodeId) {
            // Remove highlight even if invalid drop
            nodeEl.classList.remove("drag-over");
            return;
          }

          // Remove highlight
          nodeEl.classList.remove("drag-over");

          // Visual feedback for successful drop
          nodeEl.style.animation = "dropSuccess 300ms ease-out";
          setTimeout(() => {
            nodeEl.style.animation = "";
          }, 300);

          // Trigger reparent action
          this.onSidebarAction("reparentNode", {
            nodeId: draggedNodeId,
            newParentId: nodeId,
          });
        },
        { signal },
      );

      // Click handler (for navigation) - only if not dragging
      nodeEl.addEventListener(
        "click",
        (e) => {
          const target = e.target as HTMLElement;

          // Don't navigate if clicking on buttons, inputs, or their children
          if (
            target.classList.contains("delete-node-btn") ||
            target.closest(".delete-node-btn") ||
            target.closest(".edit-node-btn") ||
            target.classList.contains("tree-node-collapse-btn") ||
            target.closest(".tree-node-collapse-btn") ||
            target.classList.contains("arbor-inline-edit-input") ||
            target.closest(".arbor-inline-edit-input") ||
            target.tagName === "INPUT"
          ) {
            return;
          }

          // Don't navigate if we just dragged
          const state = this.dragState.get(nodeId);
          if (state?.hasDragged) {
            e.preventDefault();
            return;
          }

          if (nodeId) {
            this.onSidebarAction("navigateToNode", nodeId);
          }
        },
        { signal },
      );

      // Double-click handler for inline edit
      nodeEl.addEventListener(
        "dblclick",
        (e) => {
          e.stopPropagation();

          // Don't allow edit if dragging
          const state = this.dragState.get(nodeId);
          if (state?.hasDragged || state?.isDragging) {
            return;
          }

          // Don't allow edit if collapse/expand was just toggled
          const collapseState = this.collapseState.get(nodeId);
          if (collapseState?.justToggled) {
            return;
          }

          const titleEl = nodeEl.querySelector(
            ".tree-node-title",
          ) as HTMLElement;
          if (!titleEl) return;

          this.enableInlineEdit(titleEl, nodeId, "node");
        },
        { signal },
      );

      // Keyboard navigation
      nodeEl.addEventListener(
        "keydown",
        (e) => {
          this.handleTreeNodeKeydown(e, nodeEl, nodeId);
        },
        { signal },
      );
    });

    // Add keyboard support to document for tree navigation
    document.addEventListener(
      "keydown",
      (e) => {
        // Only handle if focus is within the sidebar
        const sidebar = document.getElementById("arbor-sidebar-container");
        if (!sidebar?.contains(document.activeElement)) {
          return;
        }

        // Handle tree-level keyboard shortcuts
        if ((e.metaKey || e.ctrlKey) && e.key === "f") {
          // Focus search input
          e.preventDefault();
          const searchInput = document.getElementById(
            "tree-search-input",
          ) as HTMLInputElement;
          searchInput?.focus();
        }
      },
      { signal },
    );
  }

  private handleTreeNodeKeydown(
    e: KeyboardEvent,
    nodeEl: HTMLElement,
    nodeId: string,
  ) {
    const allNodes = Array.from(
      document.querySelectorAll(
        ".tree-node[tabindex='0'], .tree-node-card[tabindex='0']",
      ),
    ) as HTMLElement[];
    const currentIndex = allNodes.indexOf(nodeEl);

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        // Navigate to node
        this.onSidebarAction("navigateToNode", nodeId);
        break;

      case "ArrowDown":
        e.preventDefault();
        // Focus next node
        if (currentIndex < allNodes.length - 1) {
          allNodes[currentIndex + 1].focus();
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        // Focus previous node
        if (currentIndex > 0) {
          allNodes[currentIndex - 1].focus();
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        // Expand node if it has children
        const collapseBtn = nodeEl.querySelector(".tree-node-collapse-btn");
        if (collapseBtn) {
          const isExpanded =
            collapseBtn.getAttribute("aria-expanded") === "true";
          if (!isExpanded) {
            (collapseBtn as HTMLElement).click();
          } else {
            // Move to first child
            const childrenContainer = document.querySelector(
              `.tree-node-children[data-parent-node-id="${nodeId}"]`,
            );
            const firstChild = childrenContainer?.querySelector(
              ".tree-node[tabindex='0'], .tree-node-card[tabindex='0']",
            ) as HTMLElement;
            firstChild?.focus();
          }
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        // Collapse node if expanded, otherwise move to parent
        const collapseBtnLeft = nodeEl.querySelector(".tree-node-collapse-btn");
        if (collapseBtnLeft) {
          const isExpanded =
            collapseBtnLeft.getAttribute("aria-expanded") === "true";
          if (isExpanded) {
            (collapseBtnLeft as HTMLElement).click();
          } else {
            // Find parent node
            this.focusParentNode(nodeEl);
          }
        } else {
          // No children, move to parent
          this.focusParentNode(nodeEl);
        }
        break;

      case "Delete":
      case "Backspace":
        // Delete node (with confirmation)
        const deleteBtn = nodeEl.querySelector(".delete-node-btn");
        if (deleteBtn) {
          e.preventDefault();
          (deleteBtn as HTMLElement).click();
        }
        break;

      case "F2":
        // Edit node name
        e.preventDefault();
        const titleEl = nodeEl.querySelector(".tree-node-title") as HTMLElement;
        if (titleEl) {
          this.enableInlineEdit(titleEl, nodeId, "node");
        }
        break;
    }
  }

  private focusParentNode(nodeEl: HTMLElement) {
    // Find the parent node by looking for the parent children container
    const childrenContainer = nodeEl.closest(".tree-node-children");
    if (childrenContainer) {
      const parentNodeId = (childrenContainer as HTMLElement).dataset
        .parentNodeId;
      if (parentNodeId) {
        const parentNode = document.querySelector(
          `.tree-node[data-node-id="${parentNodeId}"][tabindex='0'], .tree-node-card[data-node-id="${parentNodeId}"][tabindex='0']`,
        ) as HTMLElement;
        parentNode?.focus();
      }
    }
  }

  private enableInlineEdit(
    element: HTMLElement,
    id: string,
    type: "node" | "tree",
  ) {
    const originalText = element.textContent?.trim() || "";

    // Create input
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalText;
    input.className = "arbor-inline-edit-input";
    input.style.cssText = `
      width: 100%;
      background: var(--arbor-bg-elevated);
      border: 1px solid var(--arbor-primary);
      border-radius: 4px;
      padding: 4px 8px;
      color: var(--arbor-text-primary);
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      box-shadow: 0 0 0 2px var(--arbor-primary-soft);
    `;

    // Replace element content with input
    element.innerHTML = "";
    element.appendChild(input);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newText = input.value.trim();
      if (newText && newText !== originalText) {
        if (type === "node") {
          this.onSidebarAction("renameNode", { nodeId: id, newName: newText });
        } else {
          this.onSidebarAction("renameTree", { treeId: id, newName: newText });
        }
      }
      element.textContent = newText || originalText;
    };

    const cancelEdit = () => {
      element.textContent = originalText;
    };

    // Stop propagation on click to prevent triggering tree node navigation
    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Stop propagation on mousedown to prevent drag events
    input.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      // Stop all keyboard events from propagating
      e.stopPropagation();

      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit();
        input.blur(); // Remove focus to finalize the edit
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
        input.blur(); // Remove focus to cancel the edit
      }
    });
  }

  private attachTreeDropdownListeners() {
    const dropdownTrigger = document.getElementById("tree-selector");
    const dropdownMenu = document.getElementById("tree-dropdown-menu");
    const searchInput = document.getElementById(
      "tree-search-input",
    ) as HTMLInputElement;

    if (!dropdownTrigger || !dropdownMenu) return;

    // Toggle dropdown - handle both click and keyboard
    dropdownTrigger.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // Don't toggle dropdown if clicking on action buttons (like edit)
      if (
        target.classList.contains("tree-title-edit-quick") ||
        target.closest(".tree-title-edit-quick")
      ) {
        e.stopPropagation();
        return;
      }

      e.stopPropagation();
      const isOpen = dropdownMenu.style.display !== "none";

      if (isOpen) {
        dropdownMenu.style.display = "none";
        dropdownTrigger.setAttribute("aria-expanded", "false");
      } else {
        dropdownMenu.style.display = "block";
        dropdownTrigger.setAttribute("aria-expanded", "true");
        searchInput?.focus();
      }
    });

    // Keyboard support for tree selector card
    dropdownTrigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const isOpen = dropdownMenu.style.display !== "none";

        if (isOpen) {
          dropdownMenu.style.display = "none";
          dropdownTrigger.setAttribute("aria-expanded", "false");
        } else {
          dropdownMenu.style.display = "block";
          dropdownTrigger.setAttribute("aria-expanded", "true");
          searchInput?.focus();
        }
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !dropdownTrigger.contains(e.target as Node) &&
        !dropdownMenu.contains(e.target as Node)
      ) {
        dropdownMenu.style.display = "none";
        dropdownTrigger.setAttribute("aria-expanded", "false");
      }
    });

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        const items = dropdownMenu.querySelectorAll(
          ".arbor-tree-dropdown-item",
        );

        items.forEach((item) => {
          const title =
            item
              .querySelector(".arbor-tree-dropdown-item-title")
              ?.textContent?.toLowerCase() || "";
          if (title.includes(searchTerm)) {
            (item as HTMLElement).style.display = "flex";
          } else {
            (item as HTMLElement).style.display = "none";
          }
        });
      });
    }

    // Tree selection from dropdown
    dropdownMenu
      .querySelectorAll(".arbor-tree-dropdown-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const treeId = (item as HTMLElement).dataset.treeId;
          this.onSidebarAction("selectTree", treeId);
          dropdownMenu.style.display = "none";
          dropdownTrigger.setAttribute("aria-expanded", "false");
        });
      });

    // New tree from dropdown
    document
      .getElementById("new-tree-from-dropdown")
      ?.addEventListener("click", () => {
        this.onSidebarAction("newTree");
        dropdownMenu.style.display = "none";
        dropdownTrigger.setAttribute("aria-expanded", "false");
      });
  }

  private attachCollapsibleListeners() {
    document.querySelectorAll(".arbor-collapsible-header").forEach((header) => {
      const chevronBtn = header.querySelector(".arbor-collapsible-chevron");
      const sectionName = (header as HTMLElement).dataset.section;
      const content = document.querySelector(
        `[data-section-content="${sectionName}"]`,
      ) as HTMLElement;

      if (!chevronBtn || !content) return;

      // Set initial max-height for transition
      content.style.maxHeight = content.scrollHeight + "px";

      const toggleSection = () => {
        const isExpanded = chevronBtn.getAttribute("aria-expanded") === "true";

        if (isExpanded) {
          chevronBtn.setAttribute("aria-expanded", "false");
          content.setAttribute("aria-hidden", "true");
          content.style.maxHeight = "0";
        } else {
          chevronBtn.setAttribute("aria-expanded", "true");
          content.setAttribute("aria-hidden", "false");
          content.style.maxHeight = content.scrollHeight + "px";
        }
      };

      header.addEventListener("click", (e) => {
        // Don't toggle if clicking action buttons
        if ((e.target as HTMLElement).closest(".arbor-collapsible-actions")) {
          return;
        }
        toggleSection();
      });
    });
  }

  private attachNodeCollapseListeners() {
    document.querySelectorAll(".tree-node-collapse-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent any parent click handlers
        e.stopImmediatePropagation(); // Prevent other handlers on the same element

        const nodeId = (btn as HTMLElement).dataset.nodeId;
        if (!nodeId) return;

        const isExpanded = btn.getAttribute("aria-expanded") === "true";
        const childrenContainer = document.querySelector(
          `.tree-node-children[data-parent-node-id="${nodeId}"]`,
        ) as HTMLElement;

        if (!childrenContainer) return;

        // Mark that we just toggled this node to prevent accidental edit triggers
        this.collapseState.set(nodeId, { justToggled: true });
        
        // Clear the flag after a delay to allow normal interactions again
        setTimeout(() => {
          const state = this.collapseState.get(nodeId);
          if (state) {
            state.justToggled = false;
          }
        }, 500); // 500ms should be enough to prevent accidental triggers

        if (isExpanded) {
          // Collapse
          btn.setAttribute("aria-expanded", "false");
          childrenContainer.style.maxHeight = "0";
          childrenContainer.classList.add("collapsed");
        } else {
          // Expand
          btn.setAttribute("aria-expanded", "true");
          childrenContainer.style.maxHeight =
            childrenContainer.scrollHeight + "px";
          childrenContainer.classList.remove("collapsed");

          // Reset max-height after transition for dynamic content
          setTimeout(() => {
            if (!childrenContainer.classList.contains("collapsed")) {
              childrenContainer.style.maxHeight = "none";
            }
          }, 300);
        }
      });
    });
  }

  private showTreeContextMenu() {
    // Create a simple context menu with delete option
    const existingMenu = document.getElementById("arbor-tree-context-menu");
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement("div");
    menu.id = "arbor-tree-context-menu";
    menu.style.cssText = `
      position: fixed;
      background: var(--arbor-bg-raised);
      border: 1px solid var(--arbor-border-default);
      border-radius: 8px;
      box-shadow: var(--arbor-shadow-lg);
      padding: 4px;
      z-index: 10000;
      min-width: 140px;
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "arbor-context-menu-item";
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 7v4M5 7v4M3 4l1 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-8" 
              stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      Delete Tree
    `;
    deleteBtn.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: var(--arbor-error);
      font-size: 13px;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 150ms;
    `;
    deleteBtn.addEventListener("mouseenter", () => {
      deleteBtn.style.background = "rgba(184, 107, 107, 0.1)";
    });
    deleteBtn.addEventListener("mouseleave", () => {
      deleteBtn.style.background = "transparent";
    });
    deleteBtn.addEventListener("click", () => {
      this.showDeleteTreeConfirmation();
      menu.remove();
    });

    menu.appendChild(deleteBtn);

    // Position near the context menu button
    const btn = document.getElementById("tree-context-menu");
    if (btn) {
      const rect = btn.getBoundingClientRect();
      menu.style.top = rect.bottom + 4 + "px";
      menu.style.right = window.innerWidth - rect.right + "px";
    }

    document.body.appendChild(menu);

    // Close on click outside
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target as Node)) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 0);
  }

  private showDeleteNodeConfirmation(nodeId: string) {
    // Get node title for display
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
    const nodeTitle =
      nodeElement?.querySelector(".tree-node-title")?.textContent?.trim() ||
      "Untitled Node";

    this.showConfirmationDialog({
      title: "Delete Node?",
      message:
        "This action cannot be undone. The node will be permanently removed from the tree.",
      details: {
        label: "Node",
        value: nodeTitle,
      },
      confirmText: "Delete Node",
      cancelText: "Cancel",
      onConfirm: () => {
        this.onSidebarAction("deleteNode", nodeId);
      },
    });
  }

  private showDeleteTreeConfirmation() {
    // Get tree name for display
    const treeNameElement = document.querySelector(
      ".arbor-tree-dropdown-title",
    );
    const treeName = treeNameElement?.textContent?.trim() || "Untitled Tree";

    this.showConfirmationDialog({
      title: "Delete Tree?",
      message:
        "This action cannot be undone. All nodes and branches in this tree will be permanently deleted.",
      details: {
        label: "Tree",
        value: treeName,
      },
      confirmText: "Delete Tree",
      cancelText: "Cancel",
      onConfirm: () => {
        this.onSidebarAction("deleteTree");
      },
    });
  }

  private showConfirmationDialog(options: {
    title: string;
    message: string;
    details?: { label: string; value: string };
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }) {
    // Create backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "arbor-modal-backdrop";
    backdrop.style.zIndex = "2147483647";

    // Create dialog
    const dialog = document.createElement("div");
    dialog.className = "arbor-confirmation-dialog";
    dialog.innerHTML = `
      <div class="arbor-confirmation-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M10 11V17M14 11V17M4 7H20M19 7L18.133 19.142C18.0971 19.6466 17.8713 20.1188 17.5011 20.4636C17.1309 20.8083 16.6439 21 16.138 21H7.862C7.35614 21 6.86907 20.8083 6.49889 20.4636C6.1287 20.1188 5.90292 19.6466 5.867 19.142L5 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="arbor-confirmation-title">${options.title}</h3>
      <p class="arbor-confirmation-message">${options.message}</p>
      ${
        options.details
          ? `<div class="arbor-confirmation-details">
              <div class="arbor-confirmation-detail-label">${options.details.label}</div>
              <div class="arbor-confirmation-detail-value">${options.details.value}</div>
            </div>`
          : ""
      }
      <div class="arbor-confirmation-actions">
        <button class="arbor-btn arbor-btn-secondary" id="arbor-confirm-cancel">
          ${options.cancelText}
        </button>
        <button class="arbor-btn arbor-btn-destructive" id="arbor-confirm-delete">
          ${options.confirmText}
        </button>
      </div>
    `;

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Add event listeners
    const cancelBtn = dialog.querySelector("#arbor-confirm-cancel");
    const confirmBtn = dialog.querySelector("#arbor-confirm-delete");

    const closeDialog = () => {
      backdrop.remove();
    };

    cancelBtn?.addEventListener("click", closeDialog);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeDialog();
      }
    });

    confirmBtn?.addEventListener("click", () => {
      options.onConfirm();
      closeDialog();
    });

    // Keyboard support
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDialog();
        document.removeEventListener("keydown", handleKeydown);
      } else if (e.key === "Enter" && e.metaKey) {
        // Cmd+Enter or Ctrl+Enter to confirm
        options.onConfirm();
        closeDialog();
        document.removeEventListener("keydown", handleKeydown);
      }
    };

    document.addEventListener("keydown", handleKeydown);

    // Focus the confirm button
    (confirmBtn as HTMLElement)?.focus();
  }
}
