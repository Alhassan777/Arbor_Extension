# Implementation Guide: Tree Visualization
## Step-by-Step Developer Guide

This guide provides concrete steps to implement the new hierarchical tree visualization design specified in `TREE_VISUALIZATION_UX_SPEC.md`.

---

## Prerequisites

- Read `TREE_VISUALIZATION_UX_SPEC.md` for complete design specifications
- Review `ARBOR_DESIGN_SYSTEM.md` for color palette and typography
- Understand current codebase: `GraphRenderer.ts`, `GraphViewRenderer.ts`

---

## Phase 1: Layout Algorithm (Days 1-2)

### Step 1.1: Create Layout Module

**File:** `src/content/modules/TreeLayout.ts`

```typescript
interface Position {
  x: number;
  y: number;
}

interface LayoutConfig {
  levelHeight: number;
  minSiblingGap: number;
  nodeWidth: number;
  nodeHeight: number;
  paddingTop: number;
  paddingHorizontal: number;
}

export class TreeLayout {
  private config: LayoutConfig = {
    levelHeight: 160,
    minSiblingGap: 100,
    nodeWidth: 180,
    nodeHeight: 72,
    paddingTop: 60,
    paddingHorizontal: 80,
  };

  /**
   * Calculate hierarchical layout positions for all nodes
   */
  public calculateLayout(tree: ChatTree): Record<string, Position> {
    const positions: Record<string, Position> = {};
    const levels = this.assignLevels(tree);
    const subtreeWidths = this.calculateSubtreeWidths(tree);
    
    this.positionNodes(
      tree.rootNodeId, 
      tree, 
      this.config.paddingHorizontal,
      positions,
      levels,
      subtreeWidths
    );
    
    return positions;
  }

  private assignLevels(tree: ChatTree): Record<string, number> {
    const levels: Record<string, number> = {};
    
    const traverse = (nodeId: string, level: number) => {
      levels[nodeId] = level;
      const node = tree.nodes[nodeId];
      node.children.forEach(childId => traverse(childId, level + 1));
    };
    
    traverse(tree.rootNodeId, 0);
    return levels;
  }

  private calculateSubtreeWidths(tree: ChatTree): Record<string, number> {
    const widths: Record<string, number> = {};
    
    const calculate = (nodeId: string): number => {
      const node = tree.nodes[nodeId];
      
      if (node.children.length === 0) {
        widths[nodeId] = this.config.nodeWidth;
        return this.config.nodeWidth;
      }
      
      const childrenWidth = node.children
        .map(childId => calculate(childId))
        .reduce((sum, w) => sum + w + this.config.minSiblingGap, 0) 
        - this.config.minSiblingGap;
      
      widths[nodeId] = Math.max(this.config.nodeWidth, childrenWidth);
      return widths[nodeId];
    };
    
    calculate(tree.rootNodeId);
    return widths;
  }

  private positionNodes(
    nodeId: string,
    tree: ChatTree,
    startX: number,
    positions: Record<string, Position>,
    levels: Record<string, number>,
    subtreeWidths: Record<string, number>
  ) {
    const node = tree.nodes[nodeId];
    const level = levels[nodeId];
    
    if (node.children.length === 0) {
      // Leaf node: position at startX
      positions[nodeId] = {
        x: startX,
        y: this.config.paddingTop + level * this.config.levelHeight,
      };
    } else {
      // Position children first (left to right)
      let currentX = startX;
      node.children.forEach(childId => {
        this.positionNodes(
          childId, 
          tree, 
          currentX, 
          positions, 
          levels, 
          subtreeWidths
        );
        currentX += subtreeWidths[childId] + this.config.minSiblingGap;
      });
      
      // Center parent over children
      const firstChild = positions[node.children[0]];
      const lastChild = positions[node.children[node.children.length - 1]];
      const centerX = (firstChild.x + lastChild.x + this.config.nodeWidth) / 2;
      
      positions[nodeId] = {
        x: centerX - this.config.nodeWidth / 2,
        y: this.config.paddingTop + level * this.config.levelHeight,
      };
    }
  }
  
  public getNodeSize(level: number): { width: number; height: number } {
    const sizes = [
      { width: 200, height: 80 },  // Level 0
      { width: 180, height: 72 },  // Level 1
      { width: 170, height: 68 },  // Level 2
      { width: 160, height: 64 },  // Level 3+
    ];
    return sizes[Math.min(level, 3)];
  }
}
```

### Step 1.2: Update GraphRenderer to Use New Layout

**File:** `src/content/modules/GraphRenderer.ts`

```typescript
import { TreeLayout } from './TreeLayout';

export class GraphRenderer {
  private treeLayout: TreeLayout;
  
  constructor(
    private onNodeClick: (nodeId: string) => void,
    private onConnectionLabelClick: (childId: string, parentId: string) => Promise<void>
  ) {
    this.treeLayout = new TreeLayout();
  }

  renderGraph(tree: ChatTree, containerId: string = "graph-content") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    // Use new hierarchical layout
    const positions = this.treeLayout.calculateLayout(tree);
    const levels = this.calculateLevels(tree);

    // Calculate canvas size
    const bounds = this.calculateBounds(positions);
    container.style.width = `${bounds.width}px`;
    container.style.height = `${bounds.height}px`;

    // Render in order: SVG layer (connections), then nodes
    const svgLayer = this.createSVGLayer(bounds);
    container.appendChild(svgLayer);
    
    this.renderConnections(tree, positions, svgLayer);
    this.renderGraphNodes(tree, positions, levels, container);
  }
  
  private calculateLevels(tree: ChatTree): Record<string, number> {
    const levels: Record<string, number> = {};
    
    const traverse = (nodeId: string, level: number) => {
      levels[nodeId] = level;
      const node = tree.nodes[nodeId];
      node.children.forEach(childId => traverse(childId, level + 1));
    };
    
    traverse(tree.rootNodeId, 0);
    return levels;
  }
  
  // ... rest of implementation
}
```

### Step 1.3: Test Layout

**Test Cases:**
- Single node (root only)
- Linear chain (A → B → C → D)
- Binary tree (each node has 2 children)
- Unbalanced tree (one branch much deeper)
- Wide tree (root with 10 children)

---

## Phase 2: SVG Connections (Days 3-4)

### Step 2.1: Create SVG Layer

```typescript
private createSVGLayer(bounds: { width: number; height: number }): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'arbor-connections-layer');
  svg.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: ${bounds.width}px;
    height: ${bounds.height}px;
    pointer-events: none;
    z-index: 1;
  `;
  
  // Add arrow markers
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <marker id="arrow-default" markerWidth="8" markerHeight="8" 
            refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arbor-connection)"/>
    </marker>
    <marker id="arrow-hover" markerWidth="8" markerHeight="8" 
            refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arbor-accent)"/>
    </marker>
    <marker id="arrow-active" markerWidth="8" markerHeight="8" 
            refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arbor-primary)"/>
    </marker>
  `;
  svg.appendChild(defs);
  
  return svg;
}
```

### Step 2.2: Create Bezier Path Generator

```typescript
private createBezierPath(
  parentX: number,
  parentY: number,
  parentWidth: number,
  parentHeight: number,
  childX: number,
  childY: number,
  childWidth: number
): string {
  // Start: bottom center of parent
  const startX = parentX + parentWidth / 2;
  const startY = parentY + parentHeight;
  
  // End: top center of child
  const endX = childX + childWidth / 2;
  const endY = childY;
  
  // Control points for smooth S-curve
  const verticalDistance = endY - startY;
  const controlOffset = verticalDistance * 0.4;
  
  const cp1X = startX;
  const cp1Y = startY + controlOffset;
  const cp2X = endX;
  const cp2Y = endY - controlOffset;
  
  // Create cubic bezier path
  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
}
```

### Step 2.3: Render Connections

```typescript
private renderConnections(
  tree: ChatTree,
  positions: Record<string, Position>,
  svgLayer: SVGSVGElement
) {
  Object.values(tree.nodes).forEach(node => {
    if (!node.parentId || !positions[node.parentId]) return;
    
    const parent = positions[node.parentId];
    const child = positions[node.id];
    const parentSize = this.treeLayout.getNodeSize(this.levels[node.parentId]);
    const childSize = this.treeLayout.getNodeSize(this.levels[node.id]);
    
    // Create path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = this.createBezierPath(
      parent.x, parent.y, parentSize.width, parentSize.height,
      child.x, child.y, childSize.width
    );
    
    path.setAttribute('d', pathData);
    path.setAttribute('class', 'connection-line');
    path.setAttribute('data-child-id', node.id);
    path.setAttribute('marker-end', 'url(#arrow-default)');
    path.style.pointerEvents = 'stroke';
    
    // Add hover listeners
    path.addEventListener('mouseenter', () => {
      path.setAttribute('marker-end', 'url(#arrow-hover)');
    });
    path.addEventListener('mouseleave', () => {
      path.setAttribute('marker-end', 'url(#arrow-default)');
    });
    
    // Add click listener
    path.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.onConnectionLabelClick(node.id, node.parentId!);
    });
    
    svgLayer.appendChild(path);
  });
}
```

### Step 2.4: Add Connection Styles to StyleInjector

**File:** `src/content/modules/StyleInjector.ts`

```css
.arbor-connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: var(--arbor-connection);
  stroke-width: 1.5px;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  pointer-events: stroke;
}

.connection-line:hover {
  stroke: var(--arbor-accent);
  stroke-width: 2.5px;
  filter: drop-shadow(0 0 4px rgba(201, 166, 107, 0.3));
}

.connection-line.active {
  stroke: var(--arbor-primary);
  stroke-width: 2.5px;
  filter: drop-shadow(0 0 6px rgba(125, 155, 118, 0.4));
}
```

---

## Phase 3: Visual Hierarchy (Days 5-6)

### Step 3.1: Update Node Rendering with Levels

```typescript
private renderGraphNodes(
  tree: ChatTree,
  positions: Record<string, Position>,
  levels: Record<string, number>,
  container: HTMLElement
) {
  Object.entries(positions).forEach(([nodeId, pos]) => {
    const node = tree.nodes[nodeId];
    if (!node) return;
    
    const level = levels[nodeId];
    const size = this.treeLayout.getNodeSize(level);
    const isActive = this.currentNodeId === nodeId;
    const isRoot = nodeId === tree.rootNodeId;
    
    const nodeEl = document.createElement('div');
    nodeEl.className = `graph-node level-${Math.min(level, 3)} ${isActive ? 'active' : ''} ${isRoot ? 'root' : ''}`;
    nodeEl.dataset.nodeId = nodeId;
    nodeEl.dataset.level = level.toString();
    nodeEl.style.left = `${pos.x}px`;
    nodeEl.style.top = `${pos.y}px`;
    nodeEl.style.width = `${size.width}px`;
    nodeEl.style.height = `${size.height}px`;
    
    nodeEl.innerHTML = this.createNodeContent(node, level);
    
    // Add click handler
    nodeEl.addEventListener('click', () => this.onNodeClick(nodeId));
    
    container.appendChild(nodeEl);
  });
}

private createNodeContent(node: ChatNode, level: number): string {
  const platformColors = {
    chatgpt: '#10a37f',
    gemini: '#4285f4',
    perplexity: '#20808d',
  };
  
  return `
    <div class="graph-node-header">
      <div class="graph-node-title">${node.title}</div>
      <div class="graph-node-level-badge">${level}</div>
    </div>
    <div class="graph-node-body">
      <div class="graph-node-platform">
        <span class="platform-indicator" style="background: ${platformColors[node.platform]}"></span>
        <span class="platform-name">${node.platform}</span>
      </div>
    </div>
  `;
}
```

### Step 3.2: Add Level-Based Styles

```css
/* Base node styles */
.graph-node {
  position: absolute;
  background: var(--arbor-bg-raised);
  border: 1px solid var(--arbor-border-default);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  box-shadow: var(--arbor-shadow-sm);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.graph-node:hover {
  background: var(--arbor-bg-elevated);
  box-shadow: var(--arbor-shadow-md);
  transform: translateY(-2px);
  z-index: 20;
}

.graph-node.active {
  background: var(--arbor-bg-elevated);
  border-color: var(--arbor-primary);
  box-shadow: 0 0 0 3px rgba(125, 155, 118, 0.2), var(--arbor-shadow-md);
  z-index: 30;
}

/* Root node (Level 0) */
.graph-node.level-0 {
  border: 2px solid var(--arbor-accent-muted);
  box-shadow: var(--arbor-shadow-md), 0 0 0 3px rgba(201, 166, 107, 0.12);
}

.graph-node.level-0::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 16px;
  width: 10px;
  height: 10px;
  background: var(--arbor-accent);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(201, 166, 107, 0.4);
}

.graph-node.level-0 .graph-node-title {
  font-size: 14px;
  font-weight: 600;
}

/* Level 1 */
.graph-node.level-1 {
  border: 1.5px solid var(--arbor-border-strong);
}

/* Level 2 */
.graph-node.level-2 {
  border: 1px solid var(--arbor-border-default);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

/* Level 3+ */
.graph-node.level-3 {
  border: 1px solid var(--arbor-border-subtle);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  opacity: 0.95;
}

/* Node content */
.graph-node-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.graph-node-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--arbor-text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  flex: 1;
}

.graph-node-level-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  background: var(--arbor-bg-deep);
  border: 1px solid var(--arbor-border-default);
  color: var(--arbor-text-tertiary);
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.graph-node:hover .graph-node-level-badge {
  opacity: 1;
}

.graph-node-platform {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--arbor-text-tertiary);
  margin-top: auto;
}

.platform-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.platform-name {
  text-transform: capitalize;
  font-weight: 500;
}
```

---

## Phase 4: Connection Labels (Day 7)

### Step 4.1: Calculate Label Position on Curve

```typescript
private calculateLabelPosition(
  parentX: number,
  parentY: number,
  parentWidth: number,
  parentHeight: number,
  childX: number,
  childY: number,
  childWidth: number,
  t: number = 0.4  // Position at 40% along curve
): { x: number; y: number } {
  const startX = parentX + parentWidth / 2;
  const startY = parentY + parentHeight;
  const endX = childX + childWidth / 2;
  const endY = childY;
  
  const verticalDistance = endY - startY;
  const controlOffset = verticalDistance * 0.4;
  
  const cp1X = startX;
  const cp1Y = startY + controlOffset;
  const cp2X = endX;
  const cp2Y = endY - controlOffset;
  
  // Cubic bezier formula: B(t) = (1-t)³P₀ + 3(1-t)²t P₁ + 3(1-t)t² P₂ + t³P₃
  const x = Math.pow(1 - t, 3) * startX +
            3 * Math.pow(1 - t, 2) * t * cp1X +
            3 * (1 - t) * Math.pow(t, 2) * cp2X +
            Math.pow(t, 3) * endX;
            
  const y = Math.pow(1 - t, 3) * startY +
            3 * Math.pow(1 - t, 2) * t * cp1Y +
            3 * (1 - t) * Math.pow(t, 2) * cp2Y +
            Math.pow(t, 3) * endY;
  
  return { x, y };
}
```

### Step 4.2: Render Connection Labels

```typescript
private renderConnectionLabels(
  tree: ChatTree,
  positions: Record<string, Position>,
  container: HTMLElement
) {
  Object.values(tree.nodes).forEach(node => {
    if (!node.parentId || !positions[node.parentId]) return;
    
    const parent = positions[node.parentId];
    const child = positions[node.id];
    const parentSize = this.treeLayout.getNodeSize(this.levels[node.parentId]);
    const childSize = this.treeLayout.getNodeSize(this.levels[node.id]);
    
    const labelPos = this.calculateLabelPosition(
      parent.x, parent.y, parentSize.width, parentSize.height,
      child.x, child.y, childSize.width
    );
    
    if (node.connectionLabel) {
      this.createConnectionLabel(node, labelPos, container);
    } else {
      this.createAddLabelButton(node, labelPos, container);
    }
  });
}

private createConnectionLabel(
  node: ChatNode,
  pos: { x: number; y: number },
  container: HTMLElement
) {
  const label = document.createElement('div');
  label.className = 'connection-label';
  label.style.left = `${pos.x}px`;
  label.style.top = `${pos.y}px`;
  label.textContent = node.connectionLabel;
  
  label.addEventListener('click', async (e) => {
    e.stopPropagation();
    await this.onConnectionLabelClick(node.id, node.parentId!);
  });
  
  container.appendChild(label);
}

private createAddLabelButton(
  node: ChatNode,
  pos: { x: number; y: number },
  container: HTMLElement
) {
  const button = document.createElement('div');
  button.className = 'connection-add-label';
  button.style.left = `${pos.x}px`;
  button.style.top = `${pos.y}px`;
  button.textContent = '+ Label';
  
  // Show on line hover
  const line = container.querySelector(`.connection-line[data-child-id="${node.id}"]`);
  if (line) {
    line.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
    });
    line.addEventListener('mouseleave', () => {
      button.style.opacity = '0';
    });
  }
  
  button.addEventListener('click', async (e) => {
    e.stopPropagation();
    await this.onConnectionLabelClick(node.id, node.parentId!);
  });
  
  container.appendChild(button);
}
```

### Step 4.3: Add Label Styles

```css
.connection-label {
  position: absolute;
  transform: translate(-50%, -50%);
  background: var(--arbor-bg-raised);
  border: 1px solid var(--arbor-border-default);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--arbor-primary);
  white-space: nowrap;
  pointer-events: auto;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(125, 155, 118, 0.2);
  transition: all 0.15s ease;
}

.connection-label:hover {
  background: var(--arbor-bg-elevated);
  border-color: var(--arbor-primary);
  color: var(--arbor-text-primary);
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4),
              0 0 0 2px rgba(125, 155, 118, 0.3);
}

.connection-add-label {
  position: absolute;
  transform: translate(-50%, -50%);
  background: var(--arbor-bg);
  border: 1px dashed var(--arbor-border-default);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 500;
  color: var(--arbor-text-tertiary);
  opacity: 0;
  transition: all 0.2s ease;
  cursor: pointer;
  pointer-events: auto;
  z-index: 99;
}

.connection-add-label:hover {
  opacity: 1 !important;
  background: var(--arbor-primary-soft);
  border-color: var(--arbor-primary);
  border-style: solid;
  color: var(--arbor-primary);
}
```

---

## Phase 5: Interactive Features (Days 8-10)

### Path Highlighting

```typescript
private setupPathHighlighting(tree: ChatTree, container: HTMLElement) {
  const nodes = container.querySelectorAll('.graph-node');
  
  nodes.forEach(nodeEl => {
    nodeEl.addEventListener('mouseenter', (e) => {
      const nodeId = (e.target as HTMLElement).dataset.nodeId;
      if (nodeId) {
        this.highlightPathToRoot(nodeId, tree, container);
      }
    });
    
    nodeEl.addEventListener('mouseleave', () => {
      this.clearPathHighlight(container);
    });
  });
}

private highlightPathToRoot(
  nodeId: string,
  tree: ChatTree,
  container: HTMLElement
) {
  // Build path from node to root
  const path: string[] = [];
  let currentId: string | null = nodeId;
  
  while (currentId) {
    path.unshift(currentId);
    const node = tree.nodes[currentId];
    currentId = node.parentId || null;
  }
  
  // Add class to container
  container.classList.add('path-active');
  
  // Highlight nodes
  path.forEach(id => {
    const nodeEl = container.querySelector(`[data-node-id="${id}"]`);
    nodeEl?.classList.add('path-highlight');
  });
  
  // Highlight connections
  for (let i = 1; i < path.length; i++) {
    const childId = path[i];
    const connectionEl = container.querySelector(
      `.connection-line[data-child-id="${childId}"]`
    );
    connectionEl?.classList.add('path-highlight');
  }
}

private clearPathHighlight(container: HTMLElement) {
  container.classList.remove('path-active');
  container.querySelectorAll('.path-highlight')
    .forEach(el => el.classList.remove('path-highlight'));
}
```

---

## Testing Checklist

### Layout Tests
- [ ] Single node renders correctly
- [ ] Linear chain aligns vertically
- [ ] Binary tree has centered parents
- [ ] Unbalanced tree looks good
- [ ] Wide tree (10+ children) handles spacing
- [ ] Very deep tree (10+ levels) renders

### Connection Tests
- [ ] All connections use bezier curves
- [ ] Arrows point downward (parent → child)
- [ ] Hover changes color and thickness
- [ ] Click opens label dialog
- [ ] Labels position correctly on curves

### Visual Hierarchy Tests
- [ ] Root node is larger and has amber dot
- [ ] Level 1-3 nodes decrease in size
- [ ] Level badges show/hide on hover
- [ ] Shadows create depth perception
- [ ] Color contrast meets accessibility standards

### Interaction Tests
- [ ] Path highlighting works on hover
- [ ] Zoom controls function correctly
- [ ] Pan works with space + drag
- [ ] Node selection works
- [ ] Keyboard navigation works (Tab, Enter, Arrows)

---

## Performance Optimization

### Virtual Rendering (for 100+ nodes)

```typescript
private getVisibleNodes(
  positions: Record<string, Position>,
  viewport: { left: number; top: number; right: number; bottom: number }
): string[] {
  const BUFFER = 200;
  
  return Object.entries(positions)
    .filter(([_, pos]) => {
      return pos.x >= viewport.left - BUFFER &&
             pos.x <= viewport.right + BUFFER &&
             pos.y >= viewport.top - BUFFER &&
             pos.y <= viewport.bottom + BUFFER;
    })
    .map(([id]) => id);
}
```

---

## Deployment Checklist

- [ ] All inline styles removed (use CSS classes)
- [ ] No emojis in functional UI
- [ ] Arbor design system colors used
- [ ] Accessibility features tested
- [ ] Performance tested with 100+ nodes
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Mobile responsive (future consideration)
- [ ] Documentation updated

---

## Summary

Following this guide will transform the graph view from a naive layout to a professional hierarchical tree visualization. The implementation is broken into manageable phases, each building on the previous one. The result will be a modern, performant, and accessible tree view that matches industry standards while maintaining Arbor's unique organic design aesthetic.

**Estimated Time:** 10-12 developer days
**Difficulty:** Intermediate to Advanced
**Impact:** High - transforms user experience significantly
