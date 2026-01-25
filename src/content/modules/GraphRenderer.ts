import type { ChatTree, ChatNode } from "../../types";

// Simple LRU Cache implementation
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as K;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export class GraphRenderer {
  private currentTreeId: string | null = null;
  private currentNodeId: string | null = null;
  private manualPositions: Map<string, { x: number; y: number }> = new Map();
  private isLayoutManual: boolean = false;
  private graphPanZoom: any = null;

  // Differential rendering state
  private renderedNodes: Set<string> = new Set();
  private renderedConnections: Set<string> = new Set();
  private lastTreeHash: string = "";

  // Drag state management
  private dragState: Map<
    string,
    {
      isDragging: boolean;
      hasMoved: boolean;
      cleanupFn: (() => void) | null;
    }
  > = new Map();

  // Canvas measurement optimization
  private static sharedCanvas: HTMLCanvasElement | null = null;
  private static sharedContext: CanvasRenderingContext2D | null = null;
  private static measurementCache = new LRUCache<
    string,
    { width: number; height: number }
  >(100);
  private static readonly FONT =
    '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif';

  constructor(
    private onNodeClick: (nodeId: string) => void,
    private onConnectionLabelClick: (
      childId: string,
      parentId: string,
    ) => Promise<void>,
  ) {
    // Initialize shared canvas once
    if (!GraphRenderer.sharedCanvas) {
      GraphRenderer.sharedCanvas = document.createElement("canvas");
      GraphRenderer.sharedContext = GraphRenderer.sharedCanvas.getContext("2d");
    }
  }

  setGraphPanZoom(graphPanZoom: any) {
    this.graphPanZoom = graphPanZoom;
  }

  async setCurrentTree(treeId: string | null) {
    this.currentTreeId = treeId;

    // Load manual positions for this tree
    if (treeId) {
      await this.loadManualPositions(treeId);
    } else {
      this.manualPositions.clear();
      this.isLayoutManual = false;
    }
  }

  setCurrentNode(nodeId: string | null) {
    this.currentNodeId = nodeId;
  }

  private async loadManualPositions(treeId: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get(
        `manualPositions_${treeId}`,
      );
      const saved = result[`manualPositions_${treeId}`];

      if (saved) {
        this.manualPositions = new Map(Object.entries(saved.positions));
        this.isLayoutManual = saved.isManual || false;

        // Show reset button if there are manual positions
        if (this.isLayoutManual && this.manualPositions.size > 0) {
          this.showResetButton();
        }
      } else {
        this.manualPositions.clear();
        this.isLayoutManual = false;
      }
    } catch (error) {
      console.error("Failed to load manual positions:", error);
      this.manualPositions.clear();
      this.isLayoutManual = false;
    }
  }

  private async saveManualPositions(): Promise<void> {
    if (!this.currentTreeId) return;

    try {
      const positionsObj: Record<string, { x: number; y: number }> = {};
      this.manualPositions.forEach((pos, nodeId) => {
        positionsObj[nodeId] = pos;
      });

      await chrome.storage.local.set({
        [`manualPositions_${this.currentTreeId}`]: {
          positions: positionsObj,
          isManual: this.isLayoutManual,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("Failed to save manual positions:", error);
    }
  }

  async resetToAutoLayout() {
    this.manualPositions.clear();
    this.isLayoutManual = false;

    // Hide reset button
    const resetBtn = document.getElementById("reset-layout-btn");
    if (resetBtn) resetBtn.style.display = "none";

    // Clear from storage
    if (this.currentTreeId) {
      await chrome.storage.local.remove(
        `manualPositions_${this.currentTreeId}`,
      );
    }

    // Re-render with auto layout
    if (this.currentTreeId) {
      const container = document.getElementById("graph-content");
      if (container) {
        // Find the tree data from the current render
        // We'll need to pass the tree from outside or store it
        // For now, trigger a re-render by dispatching a custom event
        window.dispatchEvent(new CustomEvent("arbor-reset-layout"));
      }
    }
  }

  private showResetButton() {
    const resetBtn = document.getElementById("reset-layout-btn");
    if (resetBtn) {
      resetBtn.style.display = "flex";
    }
  }

  private updateConnectionsForNode(tree: ChatTree, nodeId: string) {
    const container = document.getElementById("graph-content");
    if (!container) return;

    // Get current positions
    const positions: Record<string, { x: number; y: number }> = {};
    const nodes = container.querySelectorAll(".graph-node");
    nodes.forEach((nodeEl) => {
      const id = (nodeEl as HTMLElement).dataset.nodeId;
      if (!id) return;

      const rect = nodeEl.getBoundingClientRect();
      const canvas = container.getBoundingClientRect();
      const size = this.getNodeSize(tree.nodes[id]);

      positions[id] = {
        x: parseFloat((nodeEl as HTMLElement).style.left) + size.width / 2,
        y: parseFloat((nodeEl as HTMLElement).style.top) + size.height / 2,
      };
    });

    // Re-render connections with updated positions (differential update)
    this.renderConnectionsDifferential(tree, positions, container, false);
  }

  private makeDraggable(nodeEl: HTMLElement, nodeId: string, tree: ChatTree) {
    // Clean up any existing drag handlers for this node
    const existingState = this.dragState.get(nodeId);
    if (existingState?.cleanupFn) {
      existingState.cleanupFn();
    }

    // Initialize drag state
    const state = {
      isDragging: false,
      hasMoved: false,
      cleanupFn: null as (() => void) | null,
    };
    this.dragState.set(nodeId, state);

    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const onMouseDown = (e: MouseEvent) => {
      // Don't drag if clicking on interactive elements
      if ((e.target as HTMLElement).closest("button")) return;

      state.isDragging = true;
      state.hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = parseFloat(nodeEl.style.left || "0");
      initialTop = parseFloat(nodeEl.style.top || "0");

      nodeEl.style.cursor = "grabbing";
      nodeEl.classList.add("dragging");
      nodeEl.style.zIndex = "1000";

      e.preventDefault();
      e.stopPropagation();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!state.isDragging) return;

      e.preventDefault();

      // Calculate delta (account for zoom)
      const currentZoom = this.graphPanZoom ? this.graphPanZoom.getScale() : 1;
      const deltaX = (e.clientX - startX) / currentZoom;
      const deltaY = (e.clientY - startY) / currentZoom;

      // Check if moved more than 3px threshold
      if (!state.hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
        state.hasMoved = true;
      }

      // Update position
      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;

      nodeEl.style.left = `${newLeft}px`;
      nodeEl.style.top = `${newTop}px`;

      // Update connections in real-time
      this.updateConnectionsForNode(tree, nodeId);
    };

    const onMouseUp = async (e: MouseEvent) => {
      if (!state.isDragging) return;

      const didMove = state.hasMoved;
      state.isDragging = false;

      nodeEl.style.cursor = "grab";
      nodeEl.classList.remove("dragging");
      nodeEl.style.zIndex = "";

      // Only save position if actually moved
      if (didMove) {
        // Save manual position (center point)
        const size = this.getNodeSize(tree.nodes[nodeId]);
        const left = parseFloat(nodeEl.style.left || "0");
        const top = parseFloat(nodeEl.style.top || "0");

        this.manualPositions.set(nodeId, {
          x: left + size.width / 2,
          y: top + size.height / 2,
        });

        // Mark as manual layout
        this.isLayoutManual = true;

        // Show reset button
        this.showResetButton();

        // Save to storage
        await this.saveManualPositions();

        // Final connection update
        this.updateConnectionsForNode(tree, nodeId);

        // Keep hasMoved flag briefly to prevent click
        setTimeout(() => {
          state.hasMoved = false;
        }, 150);
      } else {
        state.hasMoved = false;
      }
    };

    // Add event listeners
    nodeEl.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // Store cleanup function
    state.cleanupFn = () => {
      nodeEl.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    // Change cursor to indicate draggable
    nodeEl.style.cursor = "grab";
  }

  renderGraph(tree: ChatTree, containerId: string = "graph-content") {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Calculate hash to detect if tree actually changed
    const treeHash = this.calculateTreeHash(tree);
    const fullRender = this.lastTreeHash !== treeHash;

    console.log("🎨 [DRAG-DEBUG] GRAPH RENDER:", {
      treeHash,
      lastTreeHash: this.lastTreeHash,
      fullRender,
      nodeCount: Object.keys(tree.nodes).length,
      domNodeCount: container.querySelectorAll(".graph-node").length,
      treeStructure: Object.keys(tree.nodes).map((id) => ({
        id,
        parentId: tree.nodes[id].parentId,
        childrenCount: tree.nodes[id].children.length,
      })),
      timestamp: Date.now(),
    });

    if (fullRender) {
      console.log("🔄 [DRAG-DEBUG] FULL RENDER TRIGGERED - Clearing state and DOM");
      // Tree structure changed, clear differential state
      this.renderedNodes.clear();
      this.renderedConnections.clear();
      this.lastTreeHash = treeHash;

      // Clean up all drag handlers on full render
      this.dragState.forEach((state) => {
        if (state.cleanupFn) {
          state.cleanupFn();
        }
      });
      this.dragState.clear();

      // CRITICAL FIX: Remove all existing DOM elements to prevent duplicates
      const existingNodes = container.querySelectorAll(".graph-node");
      existingNodes.forEach((node: Element) => node.remove());
      const existingConnections = container.querySelectorAll("svg");
      existingConnections.forEach((conn: Element) => conn.remove());
      const existingLabels = container.querySelectorAll(".connection-label");
      existingLabels.forEach((label: Element) => label.remove());
    }

    const positions = this.calculateNodePositions(tree);

    // Calculate required canvas size based on node positions
    const bounds = this.calculateBounds(positions);
    container.style.width = `${Math.max(2000, bounds.maxX + 200)}px`;
    container.style.height = `${Math.max(2000, bounds.maxY + 200)}px`;

    // Differential rendering: only update what changed
    this.renderConnectionsDifferential(tree, positions, container, fullRender);
    this.renderGraphNodesDifferential(tree, positions, container, fullRender);

    // Clean up removed nodes
    if (fullRender) {
      this.cleanupRemovedElements(tree, container);
    }
  }

  private calculateTreeHash(tree: ChatTree): string {
    // Simple hash based on node IDs and parent relationships
    const nodeIds = Object.keys(tree.nodes).sort();
    const structure = nodeIds
      .map((id) => {
        const node = tree.nodes[id];
        return `${id}:${node.parentId || "root"}:${node.children.join(",")}`;
      })
      .join("|");
    return structure;
  }

  private cleanupRemovedElements(tree: ChatTree, container: HTMLElement) {
    // Remove nodes that no longer exist
    const existingNodes = container.querySelectorAll(".graph-node");
    console.log("🧹 [DRAG-DEBUG] CLEANUP START:", {
      domNodeCount: existingNodes.length,
      treeNodeCount: Object.keys(tree.nodes).length,
    });
    
    existingNodes.forEach((nodeEl) => {
      const nodeId = (nodeEl as HTMLElement).dataset.nodeId;
      if (nodeId && !tree.nodes[nodeId]) {
        console.log("🗑️ [DRAG-DEBUG] REMOVING STALE DOM NODE:", nodeId);
        // Clean up drag handlers
        const state = this.dragState.get(nodeId);
        if (state?.cleanupFn) {
          state.cleanupFn();
        }
        this.dragState.delete(nodeId);

        nodeEl.remove();
        this.renderedNodes.delete(nodeId);
      }
    });

    // Remove connection labels that no longer exist
    const existingLabels = container.querySelectorAll(".connection-label");
    existingLabels.forEach((label) => {
      const labelText = label.textContent || "";
      let shouldRemove = true;

      Object.values(tree.nodes).forEach((node) => {
        if (node.connectionLabel === labelText) {
          shouldRemove = false;
        }
      });

      if (shouldRemove) {
        label.remove();
      }
    });
  }

  private calculateBounds(
    positions: Record<string, { x: number; y: number }>,
  ): {
    maxX: number;
    maxY: number;
  } {
    let maxX = 0;
    let maxY = 0;

    Object.values(positions).forEach((pos) => {
      // Node positions are now center points, max node width is 200px
      maxX = Math.max(maxX, pos.x + 100); // Half of max node width (200/2)
      maxY = Math.max(maxY, pos.y + 40); // Half of max node height (80/2)
    });

    return { maxX, maxY };
  }

  private getNodeSize(node: ChatNode): { width: number; height: number } {
    // Create cache key
    const cacheKey = `${GraphRenderer.FONT}:${node.title}`;

    // Check cache first
    const cached = GraphRenderer.measurementCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Use shared canvas for measurement
    const ctx = GraphRenderer.sharedContext;
    if (!ctx) return { width: 180, height: 64 };

    ctx.font = GraphRenderer.FONT;

    // Measure title width
    const titleWidth = ctx.measureText(node.title).width;

    // Calculate needed width (padding + text + margin)
    const minWidth = 140;
    const maxWidth = 300;
    const padding = 40; // Left + right padding
    const neededWidth = Math.max(
      minWidth,
      Math.min(maxWidth, titleWidth + padding),
    );

    // Height based on whether title wraps
    const baseHeight = 64;
    const wrappedLines = Math.ceil(titleWidth / (neededWidth - padding));
    const height = baseHeight + (wrappedLines - 1) * 20;

    const size = { width: neededWidth, height: Math.max(64, height) };

    // Cache the result
    GraphRenderer.measurementCache.set(cacheKey, size);

    return size;
  }

  private calculateNodePositions(
    tree: ChatTree,
  ): Record<string, { x: number; y: number }> {
    // Calculate auto-layout positions first
    const autoPositions = this.calculateAutoLayout(tree);

    // If manual positions exist, overlay them on top of auto-layout
    if (this.isLayoutManual && this.manualPositions.size > 0) {
      const positions: Record<string, { x: number; y: number }> = {
        ...autoPositions,
      };
      // Override with manual positions where they exist
      this.manualPositions.forEach((pos, nodeId) => {
        if (tree.nodes[nodeId]) {
          // Only use if node still exists
          positions[nodeId] = pos;
        }
      });
      return positions;
    }

    return autoPositions;
  }

  private calculateAutoLayout(
    tree: ChatTree,
  ): Record<string, { x: number; y: number }> {
    console.log("📐 [DRAG-DEBUG] CALCULATE AUTO LAYOUT START:", {
      rootNodeId: tree.rootNodeId,
      totalNodes: Object.keys(tree.nodes).length,
      treeStructure: Object.keys(tree.nodes).map((id) => ({
        id,
        parentId: tree.nodes[id].parentId,
        children: tree.nodes[id].children,
      })),
    });

    const autoPositions: Record<string, { x: number; y: number }> = {};

    // Constants from design spec
    const LEVEL_HEIGHT = 160; // Vertical spacing between levels
    const MIN_SIBLING_SPACING = 100; // Minimum horizontal spacing
    const NODE_WIDTH = 180; // For spacing calculations

    // Calculate subtree widths
    const subtreeWidths = new Map<string, number>();
    const calculateWidth = (nodeId: string): number => {
      const node = tree.nodes[nodeId];
      if (!node) return 0;

      if (node.children.length === 0) {
        subtreeWidths.set(nodeId, NODE_WIDTH);
        return NODE_WIDTH;
      }

      const childrenWidth = node.children.reduce((sum, childId) => {
        return sum + calculateWidth(childId) + MIN_SIBLING_SPACING;
      }, -MIN_SIBLING_SPACING);

      const width = Math.max(NODE_WIDTH, childrenWidth);
      subtreeWidths.set(nodeId, width);
      return width;
    };

    // Assign positions - parent centered over children
    const assignPositions = (
      nodeId: string,
      level: number,
      leftBound: number,
    ): number => {
      const node = tree.nodes[nodeId];
      if (!node) return leftBound;

      if (node.children.length === 0) {
        // Leaf node
        autoPositions[nodeId] = {
          x: leftBound + NODE_WIDTH / 2,
          y: level * LEVEL_HEIGHT + 80,
        };
        return leftBound + NODE_WIDTH;
      }

      // Position children first
      let childX = leftBound;
      const childCenters: number[] = [];

      node.children.forEach((childId) => {
        const childWidth = subtreeWidths.get(childId) || NODE_WIDTH;
        const nextX = assignPositions(childId, level + 1, childX);
        childCenters.push((childX + nextX) / 2);
        childX = nextX + MIN_SIBLING_SPACING;
      });

      // Center parent over children
      const firstChild = childCenters[0];
      const lastChild = childCenters[childCenters.length - 1];
      const parentCenterX = (firstChild + lastChild) / 2;

      autoPositions[nodeId] = {
        x: parentCenterX,
        y: level * LEVEL_HEIGHT + 80,
      };

      return childX - MIN_SIBLING_SPACING;
    };

    calculateWidth(tree.rootNodeId);
    assignPositions(tree.rootNodeId, 0, 80);

    return autoPositions;
  }

  private renderConnectionsDifferential(
    tree: ChatTree,
    positions: Record<string, { x: number; y: number }>,
    canvas: HTMLElement,
    fullRender: boolean,
  ) {
    // Create or get SVG container
    let svg = canvas.querySelector(".connection-svg") as SVGSVGElement;
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("connection-svg");
      svg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: visible;
      `;

      // Add arrow markers
      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs",
      );
      defs.innerHTML = `
        <marker id="arrow-default" markerWidth="8" markerHeight="8" 
                refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="#6d665c" />
        </marker>
        <marker id="arrow-hover" markerWidth="8" markerHeight="8" 
                refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="#c9a66b" />
        </marker>
        <marker id="arrow-active" markerWidth="8" markerHeight="8" 
                refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="#7d9b76" />
        </marker>
      `;
      svg.appendChild(defs);
      canvas.insertBefore(svg, canvas.firstChild);
    } else if (fullRender) {
      // Only clear paths on full render
      Array.from(svg.querySelectorAll("path.connection-path")).forEach((p) =>
        p.remove(),
      );
      this.renderedConnections.clear();
    }

    // Store node sizes for accurate connection points
    const nodeSizes = new Map<string, { width: number; height: number }>();
    Object.keys(tree.nodes).forEach((nodeId) => {
      const node = tree.nodes[nodeId];
      nodeSizes.set(nodeId, this.getNodeSize(node));
    });

    const currentConnections = new Set<string>();

    Object.values(tree.nodes).forEach((node) => {
      if (!node.parentId || !positions[node.parentId] || !positions[node.id])
        return;

      const connectionId = `${node.parentId}->${node.id}`;
      currentConnections.add(connectionId);

      // Skip if already rendered and not full render
      if (!fullRender && this.renderedConnections.has(connectionId)) {
        // Update existing path position
        const existingPath = svg.querySelector(
          `path[data-connection-id="${connectionId}"]`,
        ) as SVGPathElement;
        if (existingPath) {
          const parentPos = positions[node.parentId];
          const childPos = positions[node.id];
          const parentSize = nodeSizes.get(node.parentId) || {
            width: 180,
            height: 64,
          };
          const childSize = nodeSizes.get(node.id) || {
            width: 180,
            height: 64,
          };

          const startX = parentPos.x;
          const startY = parentPos.y + parentSize.height / 2;
          const endX = childPos.x;
          const endY = childPos.y - childSize.height / 2;
          const controlOffset = (endY - startY) * 0.4;

          const pathData = `M ${startX},${startY} C ${startX},${startY + controlOffset} ${endX},${endY - controlOffset} ${endX},${endY}`;
          existingPath.setAttribute("d", pathData);
          return;
        }
      }

      const parentPos = positions[node.parentId];
      const childPos = positions[node.id];

      const parentSize = nodeSizes.get(node.parentId) || {
        width: 180,
        height: 64,
      };
      const childSize = nodeSizes.get(node.id) || { width: 180, height: 64 };

      // Calculate connection points (center bottom of parent, center top of child)
      const startX = parentPos.x;
      const startY = parentPos.y + parentSize.height / 2;
      const endX = childPos.x;
      const endY = childPos.y - childSize.height / 2;

      // Bezier curve control points (40% of vertical distance)
      const controlOffset = (endY - startY) * 0.4;

      const pathData = `
        M ${startX},${startY}
        C ${startX},${startY + controlOffset}
          ${endX},${endY - controlOffset}
          ${endX},${endY}
      `;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", "#6d665c");
      path.setAttribute("stroke-width", "1.5");
      path.setAttribute("fill", "none");
      path.setAttribute("marker-end", "url(#arrow-default)");
      path.classList.add("connection-path");
      path.dataset.connectionId = connectionId;
      path.style.cssText = `
        cursor: pointer;
        pointer-events: stroke;
        transition: all 150ms ease;
        stroke-linecap: round;
        stroke-linejoin: round;
      `;

      path.dataset.childNodeId = node.id;
      path.dataset.parentNodeId = node.parentId;

      // Hover effects
      path.addEventListener("mouseenter", () => {
        path.setAttribute("stroke", "#c9a66b");
        path.setAttribute("stroke-width", "2.5");
        path.setAttribute("marker-end", "url(#arrow-hover)");
        path.style.filter = "drop-shadow(0 0 4px rgba(201, 166, 107, 0.4))";
      });

      path.addEventListener("mouseleave", () => {
        path.setAttribute("stroke", "#6d665c");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("marker-end", "url(#arrow-default)");
        path.style.filter = "none";
      });

      path.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.onConnectionLabelClick(node.id, node.parentId!);
      });

      svg.appendChild(path);
      this.renderedConnections.add(connectionId);

      // Render connection label (if exists)
      if (node.connectionLabel) {
        this.renderConnectionLabelOnSVG(node, pathData, canvas);
      }
    });

    // Remove connections that no longer exist
    if (!fullRender) {
      this.renderedConnections.forEach((connectionId) => {
        if (!currentConnections.has(connectionId)) {
          const path = svg.querySelector(
            `path[data-connection-id="${connectionId}"]`,
          );
          if (path) path.remove();
          this.renderedConnections.delete(connectionId);
        }
      });
    }
  }

  private getNodeLevel(tree: ChatTree, nodeId: string): number {
    let level = 0;
    let current = tree.nodes[nodeId];
    while (current?.parentId) {
      level++;
      current = tree.nodes[current.parentId];
    }
    return level;
  }

  private renderConnectionLabelOnSVG(
    node: ChatNode,
    pathData: string,
    canvas: HTMLElement,
  ) {
    // Calculate midpoint of bezier curve for label placement
    // Parse the path to get the control points
    const pathParts = pathData.trim().split(/\s+/);
    const startX = parseFloat(pathParts[1].split(",")[0]);
    const startY = parseFloat(pathParts[1].split(",")[1]);
    const endX = parseFloat(pathParts[5].split(",")[0]);
    const endY = parseFloat(pathParts[5].split(",")[1]);

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const label = document.createElement("div");
    label.className = "connection-label";
    label.style.cssText = `
      position: absolute;
      left: ${midX}px;
      top: ${midY}px;
      transform: translate(-50%, -50%);
      background: rgba(20, 18, 16, 0.95);
      border: 1px solid var(--arbor-primary-muted);
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 11px;
      color: var(--arbor-primary);
      white-space: nowrap;
      pointer-events: auto;
      cursor: pointer;
      z-index: 10;
      font-weight: 500;
      transition: all 0.15s ease;
      box-shadow: var(--arbor-shadow-sm);
    `;
    label.textContent = node.connectionLabel || "";

    label.addEventListener("mouseenter", () => {
      label.style.background = "rgba(26, 24, 21, 0.98)";
      label.style.borderColor = "var(--arbor-primary)";
      label.style.transform = "translate(-50%, -50%) scale(1.05)";
      label.style.boxShadow = "var(--arbor-shadow-md)";
    });
    label.addEventListener("mouseleave", () => {
      label.style.background = "rgba(20, 18, 16, 0.95)";
      label.style.borderColor = "var(--arbor-primary-muted)";
      label.style.transform = "translate(-50%, -50%) scale(1)";
      label.style.boxShadow = "var(--arbor-shadow-sm)";
    });

    label.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.onConnectionLabelClick(node.id, node.parentId!);
    });

    canvas.appendChild(label);
  }

  private renderGraphNodesDifferential(
    tree: ChatTree,
    positions: Record<string, { x: number; y: number }>,
    canvas: HTMLElement,
    fullRender: boolean,
  ) {
    const nodeLevels: Record<string, number> = {};

    // Calculate levels
    const calculateLevel = (nodeId: string, level: number = 0) => {
      nodeLevels[nodeId] = level;
      const node = tree.nodes[nodeId];
      if (node) {
        node.children.forEach((childId) => calculateLevel(childId, level + 1));
      }
    };
    calculateLevel(tree.rootNodeId);

    const currentNodes = new Set<string>();

    Object.entries(positions).forEach(([nodeId, pos]) => {
      const node = tree.nodes[nodeId];
      if (!node) return;

      currentNodes.add(nodeId);

      // Check if node already exists
      let nodeEl = canvas.querySelector(
        `.graph-node[data-node-id="${nodeId}"]`,
      ) as HTMLElement;

      if (nodeEl && !fullRender) {
        // Update existing node position and state
        const level = nodeLevels[nodeId];
        const isActive = this.currentNodeId === nodeId;
        const size = this.getNodeSize(node);
        const { width, height } = size;

        nodeEl.style.left = `${pos.x - width / 2}px`;
        nodeEl.style.top = `${pos.y - height / 2}px`;
        nodeEl.style.width = `${width}px`;
        nodeEl.style.height = `${height}px`;

        // Update active state
        if (isActive) {
          nodeEl.classList.add("active");
        } else {
          nodeEl.classList.remove("active");
        }

        this.renderedNodes.add(nodeId);
        return;
      }

      const level = nodeLevels[nodeId];
      const isRoot = level === 0;
      const isActive = this.currentNodeId === nodeId;

      // Get dynamic size based on text content
      const size = this.getNodeSize(node);
      const { width, height } = size;

      nodeEl = document.createElement("div");
      nodeEl.className = `graph-node ${isActive ? "active" : ""} level-${level}`;
      nodeEl.dataset.nodeId = nodeId;
      nodeEl.dataset.level = level.toString();

      // Position centered (position is center point)
      nodeEl.style.left = `${pos.x - width / 2}px`;
      nodeEl.style.top = `${pos.y - height / 2}px`;
      nodeEl.style.width = `${width}px`;
      nodeEl.style.height = `${height}px`;

      // Level-based opacity
      if (level > 0) {
        nodeEl.style.opacity = String(1 - level * 0.05);
      }

      // Root node gets amber accent dot
      const rootAccent = isRoot ? '<div class="root-accent-dot"></div>' : "";

      nodeEl.innerHTML = `
        ${rootAccent}
        <div class="graph-node-title">${node.title}</div>
        <div class="graph-node-platform">${node.platform}</div>
      `;

      nodeEl.addEventListener("click", (e) => {
        const state = this.dragState.get(nodeId);

        // Prevent click if we're dragging or just moved
        if (
          state?.isDragging ||
          state?.hasMoved ||
          nodeEl.classList.contains("dragging")
        ) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        this.onNodeClick(nodeId);
      });

      // Make node draggable
      this.makeDraggable(nodeEl, nodeId, tree);

      canvas.appendChild(nodeEl);
      this.renderedNodes.add(nodeId);
    });

    // Remove nodes that no longer exist
    if (!fullRender) {
      this.renderedNodes.forEach((nodeId) => {
        if (!currentNodes.has(nodeId)) {
          // Clean up drag handlers
          const state = this.dragState.get(nodeId);
          if (state?.cleanupFn) {
            state.cleanupFn();
          }
          this.dragState.delete(nodeId);

          const nodeEl = canvas.querySelector(
            `.graph-node[data-node-id="${nodeId}"]`,
          );
          if (nodeEl) nodeEl.remove();
          this.renderedNodes.delete(nodeId);
        }
      });
    }
  }
}
