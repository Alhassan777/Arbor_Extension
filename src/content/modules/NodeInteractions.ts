export class NodeInteractions {
  makeNodeDraggable(
    nodeEl: HTMLElement,
    nodeId: string,
    onPositionUpdate: (
      nodeId: string,
      pos: { x: number; y: number }
    ) => Promise<void>,
    onReparent: (nodeId: string, newParentId: string) => Promise<void>
  ): { hasMoved: boolean } {
    const dragState = { hasMoved: false };
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let dropTarget: HTMLElement | null = null;

    nodeEl.addEventListener("mousedown", (e) => {
      if (
        (e.target as HTMLElement).tagName === "BUTTON" ||
        (e.target as HTMLElement).tagName === "A"
      ) {
        return;
      }

      isDragging = true;
      dragState.hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = nodeEl.getBoundingClientRect();
      const canvas = document.getElementById("graph-canvas");
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        initialX = rect.left - canvasRect.left + canvas.scrollLeft;
        initialY = rect.top - canvasRect.top + canvas.scrollTop;
      }

      nodeEl.style.cursor = "grabbing";
      nodeEl.style.zIndex = "1000";
      e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Check if moved more than 5px threshold
      if (!dragState.hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragState.hasMoved = true;
      }

      const newX = initialX + dx;
      const newY = initialY + dy;

      nodeEl.style.left = `${newX}px`;
      nodeEl.style.top = `${newY}px`;

      // Check for drop target (reparenting)
      const allNodes = document.querySelectorAll(".graph-node");
      let foundTarget = false;

      allNodes.forEach((otherNode) => {
        if (otherNode === nodeEl) return;

        const rect = otherNode.getBoundingClientRect();
        const nodeRect = nodeEl.getBoundingClientRect();

        const isOverlapping = !(
          nodeRect.right < rect.left ||
          nodeRect.left > rect.right ||
          nodeRect.bottom < rect.top ||
          nodeRect.top > rect.bottom
        );

        if (isOverlapping) {
          dropTarget = otherNode as HTMLElement;
          (otherNode as HTMLElement).style.boxShadow = "0 0 20px #10b981";
          foundTarget = true;
        } else if (dropTarget === otherNode) {
          (otherNode as HTMLElement).style.boxShadow = "";
        }
      });

      if (!foundTarget && dropTarget) {
        dropTarget.style.boxShadow = "";
        dropTarget = null;
      }
    });

    document.addEventListener("mouseup", async () => {
      if (!isDragging) return;

      isDragging = false;
      nodeEl.style.cursor = "pointer";
      nodeEl.style.zIndex = "auto";

      // Check if we're reparenting
      if (dropTarget) {
        const newParentId = dropTarget.dataset.nodeId;
        dropTarget.style.boxShadow = "";

        if (newParentId && newParentId !== nodeId) {
          await onReparent(nodeId, newParentId);
        }

        dropTarget = null;
      } else if (dragState.hasMoved) {
        // Just save new position
        const newX = parseInt(nodeEl.style.left);
        const newY = parseInt(nodeEl.style.top);
        await onPositionUpdate(nodeId, { x: newX, y: newY });
      }
    });

    return dragState;
  }

  showContextMenu(
    nodeId: string,
    x: number,
    y: number,
    onAction: (action: string, nodeId: string) => void
  ) {
    // Remove existing menu
    document.getElementById("arbor-node-context-menu")?.remove();

    const menu = document.createElement("div");
    menu.id = "arbor-node-context-menu";
    menu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 99999999;
      min-width: 200px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const menuItems = [
      { action: "rename", icon: "✏️", label: "Rename" },
      { action: "color", icon: "🎨", label: "Change Color" },
      { action: "shape", icon: "🔷", label: "Change Shape" },
      { action: "label", icon: "🏷️", label: "Edit Connection Label" },
      { action: "reset", icon: "📍", label: "Reset Position" },
      { action: "delete", icon: "❌", label: "Delete Node", color: "#ef4444" },
    ];

    menu.innerHTML = menuItems
      .map(
        (item) => `
      <div class="context-menu-item" data-action="${item.action}" style="
        padding: 10px 16px;
        cursor: pointer;
        color: ${item.color || "#fff"};
        border-bottom: 1px solid #333;
        font-size: 14px;
        transition: background 0.2s;
      ">
        ${item.icon} ${item.label}
      </div>
    `
      )
      .join("");

    // Remove last border
    const items = menu.querySelectorAll(".context-menu-item");
    if (items.length > 0) {
      (items[items.length - 1] as HTMLElement).style.borderBottom = "none";
    }

    document.body.appendChild(menu);

    // Add hover effects and click handlers
    menu.querySelectorAll(".context-menu-item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        (item as HTMLElement).style.background = "#252525";
      });
      item.addEventListener("mouseleave", () => {
        (item as HTMLElement).style.background = "transparent";
      });

      item.addEventListener("click", () => {
        const action = (item as HTMLElement).dataset.action;
        menu.remove();
        if (action) {
          onAction(action, nodeId);
        }
      });
    });

    // Close menu when clicking outside
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }
}
