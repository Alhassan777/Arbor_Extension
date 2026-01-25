# Tree Visualization UX Design Specification
## Modern Hierarchical Layout for Arbor

---

## Executive Summary

This specification defines a complete redesign of Arbor's graph view from a naive left-to-right layout to a professional top-to-bottom hierarchical tree visualization. The design prioritizes clarity, visual hierarchy, and modern aesthetics while maintaining Arbor's organic, earthy design philosophy.

**Key Improvements:**
- ✅ Top-to-bottom hierarchical layout with parent centering
- ✅ SVG-based bezier curves with directional arrows
- ✅ Clear visual hierarchy by depth level
- ✅ Interactive collapse/expand functionality
- ✅ Path highlighting and navigation aids
- ✅ Modern, professional appearance

---

## 1. Layout Algorithm Design

### 1.1 Hierarchical Tree Layout (Top-to-Bottom)

**Algorithm: Modified Walker Algorithm (Reingold-Tilford)**

This algorithm ensures:
- Parents are centered over their children
- Siblings are evenly spaced
- No overlapping nodes
- Compact, balanced layout
- Efficient use of space

**Core Principles:**
1. **Top-to-Bottom Flow**: Root at top, children flow downward
2. **Parent Centering**: Each parent horizontally centered over its children
3. **Sibling Spacing**: Consistent horizontal spacing between siblings
4. **Level Consistency**: All nodes at same depth have same Y coordinate

### 1.2 Spacing Specifications

```typescript
// Layout Constants
const LAYOUT_CONFIG = {
  // Vertical spacing between levels
  LEVEL_HEIGHT: 160,           // px between parent and child levels
  
  // Horizontal spacing
  MIN_SIBLING_GAP: 100,        // Minimum px between sibling nodes
  SUBTREE_GAP: 40,             // Minimum px between separate subtrees
  
  // Node dimensions (for collision detection)
  NODE_WIDTH: 180,             // Standard node width
  NODE_HEIGHT: 72,             // Standard node height
  
  // Canvas padding
  PADDING_TOP: 60,             // Top padding
  PADDING_HORIZONTAL: 80,      // Left/right padding
  PADDING_BOTTOM: 60,          // Bottom padding
  
  // Connection curve control points
  CURVE_STRENGTH: 0.4,         // Bezier curve intensity (0-1)
};
```

### 1.3 Layout Calculation Process

**Step 1: Assign Levels (Y-coordinates)**
```typescript
function assignLevels(rootId: string, nodes: Record<string, ChatNode>) {
  const levels: Record<string, number> = {};
  
  function traverse(nodeId: string, level: number) {
    levels[nodeId] = level;
    const node = nodes[nodeId];
    node.children.forEach(childId => traverse(childId, level + 1));
  }
  
  traverse(rootId, 0);
  return levels;
}
```

**Step 2: Calculate Subtree Widths**
```typescript
function calculateSubtreeWidth(
  nodeId: string, 
  nodes: Record<string, ChatNode>
): number {
  const node = nodes[nodeId];
  
  if (node.children.length === 0) {
    return NODE_WIDTH;
  }
  
  const childrenWidth = node.children
    .map(childId => calculateSubtreeWidth(childId, nodes))
    .reduce((sum, width) => sum + width + MIN_SIBLING_GAP, 0) - MIN_SIBLING_GAP;
  
  return Math.max(NODE_WIDTH, childrenWidth);
}
```

**Step 3: Position Nodes (X-coordinates)**
```typescript
function positionNodes(
  nodeId: string,
  nodes: Record<string, ChatNode>,
  startX: number
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const node = nodes[nodeId];
  const level = levels[nodeId];
  
  if (node.children.length === 0) {
    // Leaf node: position at startX
    positions[nodeId] = {
      x: startX,
      y: PADDING_TOP + level * LEVEL_HEIGHT
    };
  } else {
    // Position children first (left to right)
    let currentX = startX;
    node.children.forEach(childId => {
      const childPositions = positionNodes(childId, nodes, currentX);
      Object.assign(positions, childPositions);
      const childWidth = calculateSubtreeWidth(childId, nodes);
      currentX += childWidth + MIN_SIBLING_GAP;
    });
    
    // Center parent over children
    const firstChild = positions[node.children[0]];
    const lastChild = positions[node.children[node.children.length - 1]];
    const centerX = (firstChild.x + lastChild.x) / 2;
    
    positions[nodeId] = {
      x: centerX,
      y: PADDING_TOP + level * LEVEL_HEIGHT
    };
  }
  
  return positions;
}
```

### 1.4 Wide Tree Handling

For trees with many siblings at one level:

**Strategy 1: Horizontal Scrolling**
- Canvas expands horizontally as needed
- Smooth scroll with pan controls
- Minimap shows overview

**Strategy 2: Adaptive Spacing**
```typescript
// Reduce spacing for wide levels
if (siblingCount > 8) {
  MIN_SIBLING_GAP = Math.max(60, 100 - (siblingCount - 8) * 5);
}
```

**Strategy 3: Collapse/Expand**
- Allow users to collapse subtrees
- Show collapsed indicator with child count
- Expand on click

---

## 2. Connection Lines Design

### 2.1 SVG-Based Implementation

**Rationale:** SVG provides:
- Smooth bezier curves
- Crisp rendering at any zoom level
- Easy to add arrows and labels
- Better performance than rotated DIVs

**SVG Structure:**
```xml
<svg class="arbor-connections-layer" 
     style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 1;">
  <defs>
    <!-- Arrow markers -->
    <marker id="arrow-default" markerWidth="8" markerHeight="8" 
            refX="7" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arbor-connection)"/>
    </marker>
    <marker id="arrow-hover" markerWidth="8" markerHeight="8" 
            refX="7" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arbor-accent)"/>
    </marker>
    <marker id="arrow-active" markerWidth="8" markerHeight="8" 
            refX="7" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arbor-primary)"/>
    </marker>
  </defs>
  
  <!-- Connection paths -->
  <g class="connections">
    <!-- Each connection is a path element -->
  </g>
</svg>
```

### 2.2 Bezier Curve Specifications

**Vertical Bezier Curves (Top to Bottom)**

```typescript
function createConnectionPath(
  parentX: number, parentY: number,
  childX: number, childY: number
): string {
  // Start point: bottom center of parent node
  const startX = parentX + NODE_WIDTH / 2;
  const startY = parentY + NODE_HEIGHT;
  
  // End point: top center of child node
  const endX = childX + NODE_WIDTH / 2;
  const endY = childY;
  
  // Control points for smooth S-curve
  const verticalDistance = endY - startY;
  const controlOffset = verticalDistance * CURVE_STRENGTH;
  
  const cp1X = startX;
  const cp1Y = startY + controlOffset;
  
  const cp2X = endX;
  const cp2Y = endY - controlOffset;
  
  // Create cubic bezier path
  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
}
```

**Visual Representation:**
```
Parent Node
     |
     |  (slight curve)
     ↓
    /
   |   (smooth S-curve)
    \
     |  (slight curve)
     ↓
Child Node
```

### 2.3 Connection Line Styling

**Default State:**
```css
.connection-line {
  stroke: var(--arbor-connection);           /* #6d665c - warm gray */
  stroke-width: 1.5px;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  pointer-events: stroke;                    /* Only path is clickable */
  marker-end: url(#arrow-default);
}
```

**Hover State:**
```css
.connection-line:hover {
  stroke: var(--arbor-accent);               /* #c9a66b - warm amber */
  stroke-width: 2.5px;
  marker-end: url(#arrow-hover);
  filter: drop-shadow(0 0 4px rgba(201, 166, 107, 0.3));
}
```

**Active/Selected State:**
```css
.connection-line.active {
  stroke: var(--arbor-primary);              /* #7d9b76 - sage green */
  stroke-width: 2.5px;
  marker-end: url(#arrow-active);
  filter: drop-shadow(0 0 6px rgba(125, 155, 118, 0.4));
}
```

**Path Highlight State** (when hovering node, highlight path to root):
```css
.connection-line.path-highlight {
  stroke: var(--arbor-primary);
  stroke-width: 2px;
  marker-end: url(#arrow-active);
  opacity: 1;
}

.connection-line:not(.path-highlight) {
  opacity: 0.3;  /* Dim other connections */
}
```

### 2.4 Directional Arrows

**Arrow Specifications:**
```typescript
const ARROW_CONFIG = {
  width: 8,
  height: 8,
  offset: 7,     // Distance from end of line
};
```

**Arrow Positioning:**
- Placed at the child end of the connection (pointing down)
- Automatically rotates with curve angle
- Same color as connection line

### 2.5 Connection Labels

**Label Positioning:**
```typescript
function calculateLabelPosition(
  parentX: number, parentY: number,
  childX: number, childY: number
): { x: number; y: number } {
  // Position at 40% along the curve (closer to parent)
  const t = 0.4;
  
  // Calculate point on bezier curve
  const startX = parentX + NODE_WIDTH / 2;
  const startY = parentY + NODE_HEIGHT;
  const endX = childX + NODE_WIDTH / 2;
  const endY = childY;
  
  const verticalDistance = endY - startY;
  const controlOffset = verticalDistance * CURVE_STRENGTH;
  
  const cp1X = startX;
  const cp1Y = startY + controlOffset;
  const cp2X = endX;
  const cp2Y = endY - controlOffset;
  
  // Cubic bezier formula
  const x = Math.pow(1-t, 3) * startX + 
            3 * Math.pow(1-t, 2) * t * cp1X + 
            3 * (1-t) * Math.pow(t, 2) * cp2X + 
            Math.pow(t, 3) * endX;
            
  const y = Math.pow(1-t, 3) * startY + 
            3 * Math.pow(1-t, 2) * t * cp1Y + 
            3 * (1-t) * Math.pow(t, 2) * cp2Y + 
            Math.pow(t, 3) * endY;
  
  return { x, y };
}
```

**Label Styling:**
```css
.connection-label {
  position: absolute;
  transform: translate(-50%, -50%);
  
  /* Visual design */
  background: var(--arbor-bg-raised);        /* #211f1b */
  border: 1px solid var(--arbor-border-default);
  border-radius: 8px;
  padding: 4px 10px;
  
  /* Typography */
  font-size: 11px;
  font-weight: 500;
  color: var(--arbor-primary);               /* #7d9b76 */
  white-space: nowrap;
  
  /* Interaction */
  pointer-events: auto;
  cursor: pointer;
  z-index: 100;
  
  /* Shadow for legibility */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(125, 155, 118, 0.2);
  
  transition: all 0.15s ease;
}

.connection-label:hover {
  background: var(--arbor-bg-elevated);      /* #292621 */
  border-color: var(--arbor-primary);
  color: var(--arbor-text-primary);          /* #ebe6df */
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4),
              0 0 0 2px rgba(125, 155, 118, 0.3);
}
```

**Add Label Button** (when no label exists):
```css
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

.connection-line:hover ~ .connection-add-label,
.connection-add-label:hover {
  opacity: 1;
}

.connection-add-label:hover {
  background: var(--arbor-primary-soft);
  border-color: var(--arbor-primary);
  border-style: solid;
  color: var(--arbor-primary);
}
```

---

## 3. Visual Hierarchy by Level

### 3.1 Node Size Variations

**Size by Depth:**
```typescript
const NODE_SIZES = {
  0: { width: 200, height: 80, scale: 1.0 },      // Root
  1: { width: 180, height: 72, scale: 0.95 },    // Level 1
  2: { width: 170, height: 68, scale: 0.9 },     // Level 2
  3: { width: 160, height: 64, scale: 0.85 },    // Level 3+
};

function getNodeSize(level: number) {
  return NODE_SIZES[Math.min(level, 3)];
}
```

### 3.2 Visual Styling by Depth

**Root Node (Level 0):**
```css
.graph-node.level-0 {
  /* Dimensions */
  width: 200px;
  height: 80px;
  
  /* Visual emphasis */
  background: var(--arbor-bg-elevated);
  border: 2px solid var(--arbor-accent-muted);   /* Amber border */
  border-radius: 12px;
  box-shadow: var(--arbor-shadow-md),
              0 0 0 3px rgba(201, 166, 107, 0.12);
  
  /* Root indicator */
  position: relative;
}

.graph-node.level-0::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 16px;
  width: 10px;
  height: 10px;
  background: var(--arbor-accent);               /* Amber dot */
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(201, 166, 107, 0.4);
}
```

**Level 1 Nodes:**
```css
.graph-node.level-1 {
  width: 180px;
  height: 72px;
  
  background: var(--arbor-bg-raised);
  border: 1.5px solid var(--arbor-border-strong);
  border-radius: 10px;
  box-shadow: var(--arbor-shadow-sm);
}
```

**Level 2 Nodes:**
```css
.graph-node.level-2 {
  width: 170px;
  height: 68px;
  
  background: var(--arbor-bg-raised);
  border: 1px solid var(--arbor-border-default);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
```

**Level 3+ Nodes:**
```css
.graph-node.level-3,
.graph-node.level-deep {
  width: 160px;
  height: 64px;
  
  background: var(--arbor-bg-raised);
  border: 1px solid var(--arbor-border-subtle);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  opacity: 0.95;
}
```

### 3.3 Level Badge Design

**Visual Indicator:**
```css
.graph-node-level-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  
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
  
  /* Hide by default, show on hover */
  opacity: 0;
  transition: opacity 0.15s ease;
}

.graph-node:hover .graph-node-level-badge {
  opacity: 1;
}
```

### 3.4 Typography Hierarchy

**Title Sizes by Level:**
```typescript
const TITLE_SIZES = {
  0: '14px',    // Root - largest
  1: '13px',    // Level 1
  2: '13px',    // Level 2
  3: '12px',    // Level 3+
};
```

**Font Weights:**
```typescript
const TITLE_WEIGHTS = {
  0: 600,       // Root - bold
  1: 500,       // Level 1 - medium
  2: 500,       // Level 2 - medium
  3: 400,       // Level 3+ - regular
};
```

**Platform Badge Sizing:**
```css
.graph-node-platform {
  font-size: 10px;
  color: var(--arbor-text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.graph-node.level-0 .graph-node-platform {
  font-size: 11px;
}

.graph-node.level-deep .graph-node-platform {
  font-size: 9px;
}
```

### 3.5 Depth-Based Color Variations

**Subtle Background Shifts:**
```css
.graph-node.level-0 {
  background: var(--arbor-bg-elevated);          /* Lightest */
}

.graph-node.level-1 {
  background: var(--arbor-bg-raised);
}

.graph-node.level-2,
.graph-node.level-3 {
  background: color-mix(in srgb, 
    var(--arbor-bg-raised) 90%, 
    var(--arbor-bg) 10%);                        /* Slightly darker */
}
```

---

## 4. Interactive Features

### 4.1 Collapse/Expand Subtrees

**Collapsed Node Indicator:**
```css
.graph-node.collapsed {
  border-color: var(--arbor-primary-muted);
  background: var(--arbor-primary-soft);
}

.graph-node.collapsed::after {
  content: attr(data-child-count);
  position: absolute;
  bottom: -8px;
  right: -8px;
  
  width: 24px;
  height: 24px;
  border-radius: 50%;
  
  background: var(--arbor-primary);
  color: white;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  font-size: 11px;
  font-weight: 600;
  
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
```

**Toggle Button:**
```css
.graph-node-collapse-btn {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  
  width: 24px;
  height: 24px;
  border-radius: 50%;
  
  background: var(--arbor-bg-elevated);
  border: 1px solid var(--arbor-border-strong);
  color: var(--arbor-text-secondary);
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  font-size: 14px;
  cursor: pointer;
  
  opacity: 0;
  transition: all 0.15s ease;
  z-index: 10;
}

.graph-node:hover .graph-node-collapse-btn {
  opacity: 1;
}

.graph-node-collapse-btn:hover {
  background: var(--arbor-primary);
  border-color: var(--arbor-primary);
  color: white;
  transform: translateX(-50%) scale(1.15);
}

/* Icon states */
.graph-node-collapse-btn.expanded::before {
  content: '−';  /* Minus sign */
}

.graph-node-collapse-btn.collapsed::before {
  content: '+';  /* Plus sign */
}
```

**Collapse Animation:**
```css
@keyframes collapseSubtree {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

@keyframes expandSubtree {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.graph-node.collapsing {
  animation: collapseSubtree 0.2s ease-out forwards;
}

.graph-node.expanding {
  animation: expandSubtree 0.2s ease-out forwards;
}
```

### 4.2 Path Highlighting

**Behavior:** When hovering a node, highlight the path from root to that node.

**Implementation:**
```typescript
function highlightPathToRoot(nodeId: string, tree: ChatTree) {
  // Clear previous highlights
  document.querySelectorAll('.connection-line, .graph-node')
    .forEach(el => el.classList.remove('path-highlight'));
  
  // Build path from node to root
  const path: string[] = [];
  let currentId: string | null = nodeId;
  
  while (currentId) {
    path.unshift(currentId);
    const node = tree.nodes[currentId];
    currentId = node.parentId || null;
  }
  
  // Highlight nodes in path
  path.forEach(id => {
    const nodeEl = document.querySelector(`[data-node-id="${id}"]`);
    nodeEl?.classList.add('path-highlight');
  });
  
  // Highlight connections in path
  for (let i = 1; i < path.length; i++) {
    const childId = path[i];
    const connectionEl = document.querySelector(
      `.connection-line[data-child-id="${childId}"]`
    );
    connectionEl?.classList.add('path-highlight');
  }
}
```

**Styling:**
```css
.graph-node.path-highlight {
  border-color: var(--arbor-primary);
  box-shadow: 0 0 0 3px rgba(125, 155, 118, 0.2),
              var(--arbor-shadow-md);
  z-index: 10;
}

.connection-line.path-highlight {
  stroke: var(--arbor-primary);
  stroke-width: 2.5px;
  marker-end: url(#arrow-active);
  filter: drop-shadow(0 0 6px rgba(125, 155, 118, 0.4));
}

/* Dim non-highlighted elements */
.graph-view.path-active .graph-node:not(.path-highlight) {
  opacity: 0.4;
}

.graph-view.path-active .connection-line:not(.path-highlight) {
  opacity: 0.2;
}
```

### 4.3 Minimap for Navigation

**Minimap Container:**
```css
.graph-minimap {
  position: absolute;
  bottom: 20px;
  right: 20px;
  
  width: 200px;
  height: 150px;
  
  background: var(--arbor-bg);
  border: 1px solid var(--arbor-border-strong);
  border-radius: 8px;
  
  overflow: hidden;
  z-index: 1000;
  
  box-shadow: var(--arbor-shadow-lg);
}

.graph-minimap-canvas {
  width: 100%;
  height: 100%;
  transform-origin: top left;
}

.graph-minimap-viewport {
  position: absolute;
  border: 2px solid var(--arbor-primary);
  background: rgba(125, 155, 118, 0.1);
  cursor: move;
  pointer-events: auto;
}
```

**Minimap Toggle:**
```css
.graph-minimap-toggle {
  position: absolute;
  top: 8px;
  right: 8px;
  
  width: 24px;
  height: 24px;
  
  background: var(--arbor-bg-elevated);
  border: 1px solid var(--arbor-border-default);
  border-radius: 4px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  color: var(--arbor-text-secondary);
  font-size: 14px;
  cursor: pointer;
  
  transition: all 0.15s ease;
  z-index: 1001;
}

.graph-minimap-toggle:hover {
  background: var(--arbor-primary);
  border-color: var(--arbor-primary);
  color: white;
}
```

### 4.4 Zoom and Pan Controls

**Control Panel:**
```css
.arbor-zoom-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  
  background: var(--arbor-bg-raised);
  border: 1px solid var(--arbor-border-default);
  border-radius: 8px;
  padding: 4px;
}

.arbor-zoom-btn {
  width: 32px;
  height: 32px;
  
  background: transparent;
  border: none;
  border-radius: 6px;
  
  color: var(--arbor-text-secondary);
  font-size: 18px;
  font-weight: 500;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  cursor: pointer;
  transition: all 0.15s ease;
}

.arbor-zoom-btn:hover {
  background: var(--arbor-bg-elevated);
  color: var(--arbor-text-primary);
}

.arbor-zoom-btn:active {
  transform: scale(0.95);
}

.arbor-zoom-level {
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--arbor-text-tertiary);
  min-width: 48px;
  text-align: center;
}
```

**Zoom Levels:**
```typescript
const ZOOM_CONFIG = {
  min: 0.25,      // 25%
  max: 2.0,       // 200%
  step: 0.1,      // 10% increments
  default: 1.0,   // 100%
};
```

**Pan Interaction:**
```typescript
// Space + drag to pan
let isPanning = false;
let panStart = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0 && e.spaceKey) {  // Left click + space
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isPanning) {
    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    
    // Update scroll position
    canvas.scrollLeft -= deltaX;
    canvas.scrollTop -= deltaY;
    
    panStart = { x: e.clientX, y: e.clientY };
  }
});

canvas.addEventListener('mouseup', () => {
  isPanning = false;
  canvas.style.cursor = '';
});
```

---

## 5. Node Design Specifications

### 5.1 Base Node Structure

**HTML Structure:**
```html
<div class="graph-node level-{n}" data-node-id="{id}" data-level="{level}">
  <div class="graph-node-header">
    <div class="graph-node-title">{title}</div>
    <div class="graph-node-level-badge">{level}</div>
  </div>
  
  <div class="graph-node-body">
    <div class="graph-node-platform">
      <span class="platform-indicator" data-platform="{platform}"></span>
      <span class="platform-name">{platform}</span>
    </div>
  </div>
  
  <button class="graph-node-collapse-btn"></button>
</div>
```

**Base Styling:**
```css
.graph-node {
  position: absolute;
  
  /* Will be set by level */
  width: var(--node-width);
  height: var(--node-height);
  
  /* Visual design */
  background: var(--arbor-bg-raised);
  border: 1px solid var(--arbor-border-default);
  border-radius: 10px;
  
  /* Layout */
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  /* Interaction */
  cursor: pointer;
  user-select: none;
  
  /* Effects */
  box-shadow: var(--arbor-shadow-sm);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Stacking */
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
  box-shadow: 0 0 0 3px rgba(125, 155, 118, 0.2),
              var(--arbor-shadow-md);
  z-index: 30;
}
```

### 5.2 Node Components

**Title:**
```css
.graph-node-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--arbor-text-primary);
  line-height: 1.3;
  
  /* Truncate long titles */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.graph-node.level-0 .graph-node-title {
  font-size: 14px;
  font-weight: 600;
}
```

**Platform Indicator:**
```css
.graph-node-platform {
  display: flex;
  align-items: center;
  gap: 5px;
  
  font-size: 10px;
  color: var(--arbor-text-tertiary);
}

.platform-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.platform-indicator[data-platform="chatgpt"] {
  background: #10a37f;
}

.platform-indicator[data-platform="gemini"] {
  background: #4285f4;
}

.platform-indicator[data-platform="perplexity"] {
  background: #20808d;
}

.platform-name {
  text-transform: capitalize;
  font-weight: 500;
}
```

**Connection Type Badge:**
```css
.graph-node-connection-badge {
  position: absolute;
  top: -10px;
  left: 12px;
  
  padding: 3px 8px;
  border-radius: 6px;
  
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  
  background: var(--arbor-bg);
  border: 1px solid var(--arbor-border-default);
  color: var(--arbor-text-tertiary);
  
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  /* Only show on hover */
  opacity: 0;
  transition: opacity 0.15s ease;
}

.graph-node:hover .graph-node-connection-badge {
  opacity: 1;
}

.graph-node-connection-badge.extends {
  background: var(--arbor-primary-soft);
  border-color: var(--arbor-primary-muted);
  color: var(--arbor-primary);
}

.graph-node-connection-badge.deepens {
  background: var(--arbor-accent-soft);
  border-color: var(--arbor-accent-muted);
  color: var(--arbor-accent);
}
```

### 5.3 Spacing and Padding

**Internal Spacing:**
```css
.graph-node {
  padding: 12px;
  gap: 8px;
}

.graph-node.level-0 {
  padding: 14px 16px;
}

.graph-node.level-deep {
  padding: 10px 12px;
}
```

**Text Spacing:**
```css
.graph-node-header {
  margin-bottom: 4px;
}

.graph-node-title {
  margin-bottom: 6px;
}

.graph-node-platform {
  margin-top: auto;  /* Push to bottom */
}
```

---

## 6. Complete Component Specifications

### 6.1 Color Values (Arbor Palette)

```css
:root {
  /* Backgrounds */
  --arbor-bg-deep: #141210;
  --arbor-bg: #1a1815;
  --arbor-bg-raised: #211f1b;
  --arbor-bg-elevated: #292621;
  
  /* Text */
  --arbor-text-primary: #ebe6df;
  --arbor-text-secondary: #a39b8f;
  --arbor-text-tertiary: #6d665c;
  --arbor-text-disabled: #4a453f;
  
  /* Brand Colors */
  --arbor-primary: #7d9b76;
  --arbor-primary-muted: #5c7356;
  --arbor-primary-soft: rgba(125, 155, 118, 0.12);
  --arbor-primary-glow: rgba(125, 155, 118, 0.25);
  
  --arbor-accent: #c9a66b;
  --arbor-accent-muted: #96794c;
  --arbor-accent-soft: rgba(201, 166, 107, 0.15);
  
  /* Structural */
  --arbor-border-subtle: rgba(235, 230, 223, 0.06);
  --arbor-border-default: rgba(235, 230, 223, 0.1);
  --arbor-border-strong: rgba(235, 230, 223, 0.16);
  
  /* Shadows */
  --arbor-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --arbor-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
  --arbor-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35);
  
  /* Graph Specific */
  --arbor-connection: #6d665c;
  --arbor-connection-active: var(--arbor-primary);
  --arbor-connection-hover: var(--arbor-accent);
}
```

### 6.2 Typography Specifications

```css
/* Font Family */
--arbor-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 
                    'Segoe UI', system-ui, sans-serif;

/* Type Scale */
--text-xs: 10px;
--text-sm: 11px;
--text-base: 13px;
--text-md: 14px;
--text-lg: 16px;

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.4;
--leading-relaxed: 1.5;
```

### 6.3 Shadow and Border Specifications

**Elevation System:**
```css
/* Level 0: Flat (connections, background) */
box-shadow: none;

/* Level 1: Raised (default nodes) */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

/* Level 2: Elevated (hover) */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

/* Level 3: Floating (active, modals) */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);

/* Special: Glow (focus, highlight) */
box-shadow: 0 0 0 3px rgba(125, 155, 118, 0.2),
            0 4px 12px rgba(0, 0, 0, 0.25);
```

**Border Styles:**
```css
/* Subtle: section dividers */
border: 1px solid var(--arbor-border-subtle);

/* Default: node borders */
border: 1px solid var(--arbor-border-default);

/* Strong: emphasized elements */
border: 1px solid var(--arbor-border-strong);

/* Accent: active/selected */
border: 2px solid var(--arbor-primary);
```

### 6.4 Animation Timing

**Transition Durations:**
```css
/* Instant: 0ms - No animation needed */

/* Fast: 100ms - Quick feedback (button press) */
transition: all 0.1s ease;

/* Normal: 150ms - Standard interactions (hover, focus) */
transition: all 0.15s ease;

/* Moderate: 200ms - Complex state changes */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Slow: 300ms - Layout changes, animations */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

**Easing Functions:**
```css
/* Linear: constant speed */
ease: linear

/* Ease: gentle acceleration/deceleration (default) */
ease: ease

/* Ease-out: strong start, gentle end (most UI) */
ease: cubic-bezier(0.4, 0, 0.2, 1)

/* Ease-in: gentle start, strong end (exits) */
ease: cubic-bezier(0.4, 0, 1, 1)

/* Spring: bouncy, playful (special cases) */
ease: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## 7. User Flow & Interaction Patterns

### 7.1 Initial View

**Default State:**
1. Graph loads with root node centered in viewport
2. All nodes expanded (up to level 3)
3. Zoom at 100%
4. Minimap visible in bottom-right

**First Interaction Hints:**
- Subtle pulsing animation on zoom controls (first 3 seconds)
- Cursor changes to `grab` on canvas (indicating pan capability)

### 7.2 Navigation Patterns

**Primary Navigation:**
- **Scroll Wheel**: Zoom in/out
- **Space + Drag**: Pan canvas
- **Click Node**: Select and show details
- **Double-Click Node**: Focus on subtree

**Secondary Navigation:**
- **Minimap Drag**: Quick navigation to different tree areas
- **Zoom Controls**: Precise zoom adjustments
- **Path Highlighting**: Understand relationships

### 7.3 Interaction States

**State Machine:**
```
Default → Hover → Active → Selected

Collapsed ↔ Expanded

Normal → Path Highlight → Normal
```

**Visual Feedback Timeline:**
```
0ms:    User action (click, hover)
0-50ms: Immediate feedback (cursor change)
50-150ms: Visual transition begins
150ms:  Transition complete
```

---

## 8. Responsive Behavior

### 8.1 Canvas Sizing

**Dynamic Canvas:**
```typescript
function calculateCanvasSize(positions: Record<string, Position>) {
  const bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  };
  
  Object.values(positions).forEach(pos => {
    bounds.minX = Math.min(bounds.minX, pos.x);
    bounds.maxX = Math.max(bounds.maxX, pos.x + NODE_WIDTH);
    bounds.minY = Math.min(bounds.minY, pos.y);
    bounds.maxY = Math.max(bounds.maxY, pos.y + NODE_HEIGHT);
  });
  
  return {
    width: Math.max(
      container.clientWidth, 
      bounds.maxX - bounds.minX + PADDING_HORIZONTAL * 2
    ),
    height: Math.max(
      container.clientHeight,
      bounds.maxY - bounds.minY + PADDING_TOP + PADDING_BOTTOM
    ),
  };
}
```

### 8.2 Viewport Adaptation

**Small Trees** (fits in viewport):
- Center tree in viewport
- No scrollbars
- Minimap hidden

**Large Trees** (exceeds viewport):
- Enable scrollbars
- Show minimap
- Enable pan controls
- Suggest zoom out if tree > 200% viewport

---

## 9. Accessibility Considerations

### 9.1 Keyboard Navigation

**Tab Order:**
1. Zoom controls
2. Graph nodes (depth-first traversal)
3. Connection labels
4. Collapse/expand buttons
5. Minimap

**Keyboard Shortcuts:**
- `Tab`: Navigate between nodes
- `Enter/Space`: Select node
- `Arrow Keys`: Navigate between siblings/parent-child
- `+/-`: Zoom in/out
- `0`: Reset zoom
- `C`: Collapse/expand focused node
- `H`: Toggle path highlight for focused node

### 9.2 Screen Reader Support

**ARIA Labels:**
```html
<div class="graph-node" 
     role="button" 
     tabindex="0"
     aria-label="Node: {title}, Level {level}, Platform: {platform}"
     aria-describedby="node-desc-{id}">
  <!-- content -->
</div>

<div id="node-desc-{id}" class="sr-only">
  {hasChildren ? `Has ${childCount} children` : 'Leaf node'}
  {connectionLabel ? `Connected via: ${connectionLabel}` : ''}
</div>
```

**Live Regions:**
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Announce state changes -->
  <!-- "Node expanded, showing 3 children" -->
  <!-- "Zoomed to 150%" -->
</div>
```

### 9.3 Focus Indicators

**Keyboard Focus:**
```css
.graph-node:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--arbor-bg),
              0 0 0 5px var(--arbor-primary);
  z-index: 100;
}

.connection-line:focus-visible {
  stroke: var(--arbor-primary);
  stroke-width: 3px;
  filter: drop-shadow(0 0 8px rgba(125, 155, 118, 0.5));
}
```

---

## 10. Performance Considerations

### 10.1 Rendering Optimization

**Virtual Rendering** (for large trees):
```typescript
// Only render nodes within viewport + buffer
const VIEWPORT_BUFFER = 200; // px

function getVisibleNodes(
  positions: Record<string, Position>,
  viewport: Viewport
): string[] {
  return Object.entries(positions)
    .filter(([_, pos]) => {
      return pos.x >= viewport.left - VIEWPORT_BUFFER &&
             pos.x <= viewport.right + VIEWPORT_BUFFER &&
             pos.y >= viewport.top - VIEWPORT_BUFFER &&
             pos.y <= viewport.bottom + VIEWPORT_BUFFER;
    })
    .map(([id]) => id);
}
```

**Connection Culling:**
```typescript
// Only render connections for visible nodes
function getVisibleConnections(
  visibleNodes: Set<string>,
  tree: ChatTree
): Connection[] {
  return Object.values(tree.nodes)
    .filter(node => 
      visibleNodes.has(node.id) && 
      node.parentId && 
      visibleNodes.has(node.parentId)
    )
    .map(node => ({
      parentId: node.parentId!,
      childId: node.id,
    }));
}
```

### 10.2 Animation Performance

**Use CSS Transforms:**
```css
/* Good: GPU-accelerated */
transform: translateY(-2px);
transform: scale(1.05);

/* Avoid: Forces repaint */
top: calc(var(--top) - 2px);
width: calc(var(--width) * 1.05);
```

**Throttle/Debounce:**
```typescript
// Throttle pan updates to 60fps
const throttledPan = throttle((deltaX, deltaY) => {
  updateCanvasPosition(deltaX, deltaY);
}, 16);  // ~60fps

// Debounce zoom level display
const debouncedZoomDisplay = debounce((level) => {
  updateZoomDisplay(level);
}, 100);
```

---

## 11. Implementation Checklist

### Phase 1: Layout Algorithm
- [ ] Implement modified Walker algorithm
- [ ] Calculate subtree widths
- [ ] Position nodes with parent centering
- [ ] Handle edge cases (single child, wide trees)
- [ ] Test with various tree structures

### Phase 2: SVG Connections
- [ ] Create SVG layer
- [ ] Implement bezier curve generation
- [ ] Add arrow markers
- [ ] Style connection states
- [ ] Add hover effects

### Phase 3: Visual Hierarchy
- [ ] Implement level-based sizing
- [ ] Apply depth-based styling
- [ ] Add level badges
- [ ] Create root node distinction
- [ ] Test visual clarity

### Phase 4: Connection Labels
- [ ] Position labels on curves
- [ ] Style label badges
- [ ] Add hover interactions
- [ ] Implement "Add Label" button
- [ ] Connect to edit dialog

### Phase 5: Interactive Features
- [ ] Implement collapse/expand
- [ ] Add path highlighting
- [ ] Create minimap component
- [ ] Enhance zoom controls
- [ ] Add keyboard shortcuts

### Phase 6: Polish & Optimization
- [ ] Implement virtual rendering
- [ ] Optimize animations
- [ ] Add accessibility features
- [ ] Test performance with large trees
- [ ] Cross-browser testing

---

## 12. Design Rationale

### Why Top-to-Bottom Layout?
- **Natural Reading**: Western users read top-to-bottom
- **Hierarchy Clarity**: "Higher" = more important
- **Compact Width**: Trees grow vertically, not horizontally
- **Standard Convention**: Matches org charts, family trees, etc.

### Why Bezier Curves?
- **Visual Appeal**: Softer, more organic than straight lines
- **Clarity**: Curves prevent visual confusion in dense graphs
- **Direction**: Natural flow guides eye from parent to child
- **Modern**: Professional tools (Mermaid, Figma) use curves

### Why Arrows?
- **Directionality**: Clear parent → child relationship
- **Scanning**: Easier to follow connections quickly
- **Accessibility**: Visual cue for screen magnification users

### Why Collapse/Expand?
- **Scalability**: Handle trees with 100+ nodes
- **Focus**: Hide irrelevant subtrees
- **Performance**: Render fewer elements
- **User Control**: Let users manage complexity

### Why Path Highlighting?
- **Context**: Show node's ancestry quickly
- **Navigation**: Help users understand their location
- **Learning**: Educational for complex trees
- **Feedback**: Confirms relationships

### Why Minimap?
- **Overview**: See entire tree structure
- **Navigation**: Quick jump to distant branches
- **Orientation**: Never get lost in large trees
- **Standard**: Expected feature in graph tools

---

## 13. Future Enhancements

### Phase 2 Features (Future):
- **Auto-Layout Modes**: Switch between tree, force-directed, radial
- **Filtering**: Hide/show nodes by platform, date, etc.
- **Search**: Find and highlight specific nodes
- **Export**: Save tree as SVG/PNG
- **Themes**: Alternative color schemes
- **Animations**: Transition between layouts smoothly
- **Touch Support**: Multi-touch gestures for zoom/pan
- **Node Grouping**: Visual containers for related subtrees

---

## Appendix A: Code Examples

### Complete Node Positioning Function

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

const CONFIG: LayoutConfig = {
  levelHeight: 160,
  minSiblingGap: 100,
  nodeWidth: 180,
  nodeHeight: 72,
  paddingTop: 60,
  paddingHorizontal: 80,
};

function layoutTree(
  tree: ChatTree
): Record<string, Position> {
  const positions: Record<string, Position> = {};
  const levels: Record<string, number> = {};
  
  // Step 1: Assign levels
  function assignLevel(nodeId: string, level: number) {
    levels[nodeId] = level;
    const node = tree.nodes[nodeId];
    node.children.forEach(childId => assignLevel(childId, level + 1));
  }
  assignLevel(tree.rootNodeId, 0);
  
  // Step 2: Calculate subtree widths
  const subtreeWidths: Record<string, number> = {};
  
  function calculateWidth(nodeId: string): number {
    const node = tree.nodes[nodeId];
    
    if (node.children.length === 0) {
      subtreeWidths[nodeId] = CONFIG.nodeWidth;
      return CONFIG.nodeWidth;
    }
    
    const childrenWidth = node.children
      .map(childId => calculateWidth(childId))
      .reduce((sum, w) => sum + w + CONFIG.minSiblingGap, 0) 
      - CONFIG.minSiblingGap;
    
    subtreeWidths[nodeId] = Math.max(CONFIG.nodeWidth, childrenWidth);
    return subtreeWidths[nodeId];
  }
  calculateWidth(tree.rootNodeId);
  
  // Step 3: Position nodes
  function positionNode(nodeId: string, startX: number) {
    const node = tree.nodes[nodeId];
    const level = levels[nodeId];
    
    if (node.children.length === 0) {
      positions[nodeId] = {
        x: startX,
        y: CONFIG.paddingTop + level * CONFIG.levelHeight,
      };
    } else {
      // Position children
      let currentX = startX;
      node.children.forEach(childId => {
        positionNode(childId, currentX);
        currentX += subtreeWidths[childId] + CONFIG.minSiblingGap;
      });
      
      // Center parent over children
      const firstChild = positions[node.children[0]];
      const lastChild = positions[node.children[node.children.length - 1]];
      
      positions[nodeId] = {
        x: (firstChild.x + lastChild.x + CONFIG.nodeWidth) / 2 - CONFIG.nodeWidth / 2,
        y: CONFIG.paddingTop + level * CONFIG.levelHeight,
      };
    }
  }
  positionNode(tree.rootNodeId, CONFIG.paddingHorizontal);
  
  return positions;
}
```

### Complete Bezier Connection Function

```typescript
function createConnection(
  parentPos: Position,
  childPos: Position,
  nodeWidth: number,
  nodeHeight: number
): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  // Calculate connection points
  const startX = parentPos.x + nodeWidth / 2;
  const startY = parentPos.y + nodeHeight;
  const endX = childPos.x + nodeWidth / 2;
  const endY = childPos.y;
  
  // Control points for smooth curve
  const verticalDistance = endY - startY;
  const controlOffset = verticalDistance * 0.4;
  
  const cp1X = startX;
  const cp1Y = startY + controlOffset;
  const cp2X = endX;
  const cp2Y = endY - controlOffset;
  
  // Create path string
  const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  
  path.setAttribute('d', pathData);
  path.setAttribute('class', 'connection-line');
  path.setAttribute('marker-end', 'url(#arrow-default)');
  
  return path;
}
```

---

## Appendix B: Design Mockups Reference

**Refer to the provided screenshot for visual reference of:**
- Node arrangement (currently incorrect left-to-right)
- Connection line style (currently rotated divs)
- Overall canvas layout

**Target design inspiration:**
- Mermaid.js flowcharts (top-to-bottom hierarchy)
- Figma's layer structure visualization
- VS Code's file tree with collapse/expand

---

## Conclusion

This specification provides a complete blueprint for transforming Arbor's graph view from a naive layout into a professional, modern hierarchical tree visualization. The design prioritizes:

1. **Clarity**: Easy to understand relationships at a glance
2. **Visual Hierarchy**: Clear distinction between levels
3. **Interactivity**: Collapse, expand, zoom, and navigate with ease
4. **Aesthetics**: Modern, organic design that fits Arbor's brand
5. **Performance**: Optimized for trees with 100+ nodes
6. **Accessibility**: Keyboard navigation and screen reader support

The result will be a graph view that looks professional, functions intuitively, and scales to handle complex conversation trees.
