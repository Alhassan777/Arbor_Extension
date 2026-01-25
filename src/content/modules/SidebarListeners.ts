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
    document.querySelectorAll(".untracked-chat-item").forEach((item) => {
      const chatUrl = (item as HTMLElement).dataset.chatUrl;
      const chatIndex = (item as HTMLElement).dataset.chatIndex;

      item.addEventListener(
        "click",
        (e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("add-to-tree-btn")) {
            // Use chat URL instead of index to ensure correct chat is added
            this.onSidebarAction("addChatToTree", chatUrl);
          } else if (chatUrl) {
            window.location.href = chatUrl;
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

    // Tree context menu button
    document.getElementById("tree-context-menu")?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        this.showTreeContextMenu();
      },
      { signal },
    );

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

          console.log("🔵 [DRAG-DEBUG] SIDEBAR DRAG START:", {
            nodeId,
            nodeElement: nodeEl,
            currentParent: nodeEl.closest(".tree-node-children")?.getAttribute("data-parent-node-id") || "root",
            elementRect: nodeEl.getBoundingClientRect(),
            timestamp: Date.now(),
          });

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

          console.log("🟢 [DRAG-DEBUG] SIDEBAR DRAG END:", {
            nodeId,
            wasDragging,
            nodeStillInDOM: document.contains(nodeEl),
            allNodeElements: Array.from(document.querySelectorAll(`[data-node-id="${nodeId}"]`)).length,
            timestamp: Date.now(),
          });

          nodeEl.style.opacity = "1";
          nodeEl.classList.remove("dragging");

          // Remove drop target highlighting from all nodes
          document.querySelectorAll(".tree-node").forEach((n) => {
            (n as HTMLElement).style.background = "";
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
          nodeEl.style.background = "rgba(125, 155, 118, 0.15)";
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
            nodeEl.style.background = "";
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
            console.log("⚠️ [DRAG-DEBUG] DROP REJECTED:", {
              reason: draggedNodeId ? "self-drop" : "no-node-id",
              draggedNodeId,
              dropTargetNodeId: nodeId,
            });
            return;
          }

          console.log("🎯 [DRAG-DEBUG] SIDEBAR DROP EVENT:", {
            draggedNodeId,
            dropTargetNodeId: nodeId,
            draggedElementsBeforeDrop: Array.from(document.querySelectorAll(`[data-node-id="${draggedNodeId}"]`)).length,
            timestamp: Date.now(),
          });

          // Remove highlight
          nodeEl.style.background = "";

          // Trigger reparent action
          this.onSidebarAction("reparentNode", {
            nodeId: draggedNodeId,
            newParentId: nodeId,
          });

          console.log("📤 [DRAG-DEBUG] REPARENT ACTION TRIGGERED:", {
            draggedNodeId,
            newParentId: nodeId,
            timestamp: Date.now(),
          });
        },
        { signal },
      );

      // Click handler (for navigation) - only if not dragging
      nodeEl.addEventListener(
        "click",
        (e) => {
          // Don't navigate if clicking on delete button
          const target = e.target as HTMLElement;
          if (
            target.classList.contains("delete-node-btn") ||
            target.closest(".delete-node-btn")
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

          const titleEl = nodeEl.querySelector(
            ".tree-node-title",
          ) as HTMLElement;
          if (!titleEl) return;

          this.enableInlineEdit(titleEl, nodeId, "node");
        },
        { signal },
      );
    });
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

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
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

    // Toggle dropdown
    dropdownTrigger.addEventListener("click", (e) => {
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

        const nodeId = (btn as HTMLElement).dataset.nodeId;
        if (!nodeId) return;

        const isExpanded = btn.getAttribute("aria-expanded") === "true";
        const childrenContainer = document.querySelector(
          `.tree-node-children[data-parent-node-id="${nodeId}"]`,
        ) as HTMLElement;

        if (!childrenContainer) return;

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
      this.onSidebarAction("deleteTree");
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
}
