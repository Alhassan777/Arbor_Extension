import type { ChatTree, ChatNode } from "../../types";

export class GraphRenderer {
  private currentTreeId: string | null = null;
  private currentNodeId: string | null = null;

  constructor(
    private onNodeClick: (nodeId: string) => void,
    private onConnectionLabelClick: (
      childId: string,
      parentId: string
    ) => Promise<void>
  ) {}

  setCurrentTree(treeId: string | null) {
    this.currentTreeId = treeId;
  }

  setCurrentNode(nodeId: string | null) {
    this.currentNodeId = nodeId;
  }

  renderGraph(tree: ChatTree, containerId: string = "graph-content") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    const positions = this.calculateNodePositions(tree);

    // Calculate required canvas size based on node positions
    const bounds = this.calculateBounds(positions);
    container.style.width = `${Math.max(2000, bounds.maxX + 200)}px`;
    container.style.height = `${Math.max(2000, bounds.maxY + 200)}px`;

    this.renderConnections(tree, positions, container);
    this.renderGraphNodes(tree, positions, container);
  }

  private calculateBounds(
    positions: Record<string, { x: number; y: number }>
  ): {
    maxX: number;
    maxY: number;
  } {
    let maxX = 0;
    let maxY = 0;

    Object.values(positions).forEach((pos) => {
      maxX = Math.max(maxX, pos.x + 120); // Node width
      maxY = Math.max(maxY, pos.y + 80); // Node height
    });

    return { maxX, maxY };
  }

  private calculateNodePositions(
    tree: ChatTree
  ): Record<string, { x: number; y: number }> {
    const positions: Record<string, { x: number; y: number }> = {};
    const levelCounts: Record<number, number> = {};

    const traverse = (nodeId: string, level: number) => {
      const node = tree.nodes[nodeId];
      if (!node) return;

      // Use custom position if available, otherwise auto-layout
      if (node.customPosition) {
        positions[nodeId] = node.customPosition;
      } else {
        if (!levelCounts[level]) levelCounts[level] = 0;

        const x = 40 + level * 180;
        const y = 40 + levelCounts[level] * 100;

        positions[nodeId] = { x, y };
        levelCounts[level]++;
      }

      node.children.forEach((childId) => traverse(childId, level + 1));
    };

    traverse(tree.rootNodeId, 0);
    return positions;
  }

  private renderConnections(
    tree: ChatTree,
    positions: Record<string, { x: number; y: number }>,
    canvas: HTMLElement
  ) {
    Object.values(tree.nodes).forEach((node) => {
      if (node.parentId && positions[node.parentId] && positions[node.id]) {
        const parent = positions[node.parentId];
        const child = positions[node.id];

        const line = document.createElement("div");
        line.className = "connection-line";
        line.dataset.childNodeId = node.id;
        line.style.cursor = "pointer";
        line.style.pointerEvents = "auto";

        const length = Math.sqrt(
          Math.pow(child.x - parent.x, 2) + Math.pow(child.y - parent.y, 2)
        );
        const angle =
          (Math.atan2(child.y - parent.y, child.x - parent.x) * 180) / Math.PI;

        line.style.width = `${length}px`;
        line.style.left = `${parent.x + 60}px`;
        line.style.top = `${parent.y + 20}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transition = "all 0.2s ease";

        // Add hover effect
        line.addEventListener("mouseenter", () => {
          line.style.backgroundColor = node.connectionLabel
            ? "rgba(74, 156, 255, 0.8)"
            : "rgba(94, 234, 212, 0.6)";
          line.style.height = "3px";
        });
        line.addEventListener("mouseleave", () => {
          line.style.backgroundColor = "";
          line.style.height = "";
        });

        // Make line clickable to edit label
        line.addEventListener("click", async (e) => {
          e.stopPropagation();
          await this.onConnectionLabelClick(node.id, node.parentId!);
        });

        canvas.appendChild(line);

        // Render label or add button
        this.renderConnectionLabel(node, parent, child, canvas);
      }
    });
  }

  private renderConnectionLabel(
    node: ChatNode,
    parent: { x: number; y: number },
    child: { x: number; y: number },
    canvas: HTMLElement
  ) {
    const midX = (parent.x + child.x) / 2 + 60;
    const midY = (parent.y + child.y) / 2 + 20;

    if (node.connectionLabel) {
      const label = document.createElement("div");
      label.className = "connection-label";
      label.style.cssText = `
        position: absolute;
        left: ${midX}px;
        top: ${midY}px;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(45, 212, 167, 0.2), rgba(45, 212, 167, 0.1));
        border: 1px solid rgba(45, 212, 167, 0.4);
        border-radius: 12px;
        padding: 4px 10px;
        font-size: 11px;
        color: #2dd4a7;
        white-space: nowrap;
        pointer-events: auto;
        cursor: pointer;
        z-index: 10;
        font-weight: 500;
        transition: all 0.15s ease;
      `;
      label.textContent = node.connectionLabel;

      label.addEventListener("mouseenter", () => {
        label.style.background =
          "linear-gradient(135deg, rgba(45, 212, 167, 0.3), rgba(45, 212, 167, 0.2))";
        label.style.borderColor = "rgba(45, 212, 167, 0.6)";
        label.style.transform = "translate(-50%, -50%) scale(1.05)";
      });
      label.addEventListener("mouseleave", () => {
        label.style.background =
          "linear-gradient(135deg, rgba(45, 212, 167, 0.2), rgba(45, 212, 167, 0.1))";
        label.style.borderColor = "rgba(45, 212, 167, 0.4)";
        label.style.transform = "translate(-50%, -50%) scale(1)";
      });

      label.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.onConnectionLabelClick(node.id, node.parentId!);
      });

      canvas.appendChild(label);
    } else {
      // Show "+ Label" button
      const addButton = document.createElement("div");
      addButton.className = "connection-add-label";
      addButton.style.cssText = `
        position: absolute;
        left: ${midX}px;
        top: ${midY}px;
        transform: translate(-50%, -50%);
        background: rgba(28, 36, 32, 0.9);
        border: 1px solid #2a3530;
        border-radius: 10px;
        padding: 4px 8px;
        font-size: 10px;
        color: #6a7570;
        white-space: nowrap;
        pointer-events: auto;
        cursor: pointer;
        z-index: 10;
        opacity: 0;
        font-weight: 600;
        transition: all 0.15s ease;
      `;
      addButton.textContent = "+ Label";

      // Show/hide on hover
      const line = canvas.querySelector(`[data-child-node-id="${node.id}"]`);
      if (line) {
        line.addEventListener("mouseenter", () => {
          addButton.style.opacity = "1";
        });
        line.addEventListener("mouseleave", () => {
          addButton.style.opacity = "0";
        });
      }

      addButton.addEventListener("mouseenter", () => {
        addButton.style.opacity = "1";
        addButton.style.background = "rgba(45, 212, 167, 0.2)";
        addButton.style.borderColor = "rgba(45, 212, 167, 0.6)";
        addButton.style.color = "#2dd4a7";
        addButton.style.transform = "translate(-50%, -50%) scale(1.05)";
      });

      addButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.onConnectionLabelClick(node.id, node.parentId!);
      });

      canvas.appendChild(addButton);
    }
  }

  private renderGraphNodes(
    tree: ChatTree,
    positions: Record<string, { x: number; y: number }>,
    canvas: HTMLElement
  ) {
    Object.entries(positions).forEach(([nodeId, pos]) => {
      const node = tree.nodes[nodeId];
      if (!node) return;

      const isActive = this.currentNodeId === nodeId;
      const nodeEl = document.createElement("div");
      nodeEl.className = `graph-node ${isActive ? "active" : ""}`;
      nodeEl.dataset.nodeId = nodeId;
      nodeEl.style.left = `${pos.x}px`;
      nodeEl.style.top = `${pos.y}px`;

      // Apply custom styling
      if (node.color) {
        nodeEl.style.borderColor = node.color;
      }

      this.applyNodeShape(nodeEl, node.shape);

      const platformEmoji = {
        chatgpt: "🤖",
        gemini: "✨",
        perplexity: "🔍",
      }[node.platform];

      nodeEl.innerHTML = `
        <div class="graph-node-title">${node.title}</div>
        <div class="graph-node-platform">${platformEmoji} ${node.platform}</div>
      `;

      canvas.appendChild(nodeEl);
    });
  }

  private applyNodeShape(nodeEl: HTMLElement, shape?: string) {
    if (!shape) return;

    switch (shape) {
      case "circle":
        nodeEl.style.borderRadius = "50%";
        nodeEl.style.minWidth = "80px";
        nodeEl.style.minHeight = "80px";
        nodeEl.style.display = "flex";
        nodeEl.style.flexDirection = "column";
        nodeEl.style.alignItems = "center";
        nodeEl.style.justifyContent = "center";
        break;
      case "rounded":
        nodeEl.style.borderRadius = "12px";
        break;
      case "rectangle":
        nodeEl.style.borderRadius = "0px";
        break;
      case "diamond":
        nodeEl.style.transform = "rotate(45deg)";
        nodeEl.style.padding = "20px";
        break;
    }
  }
}
