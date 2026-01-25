# Tree Visualization Quick Reference
## Essential Specifications at a Glance

---

## 📐 Layout Constants

```typescript
LEVEL_HEIGHT: 160px          // Vertical space between levels
MIN_SIBLING_GAP: 100px       // Horizontal space between siblings
NODE_WIDTH: 180px            // Standard node width (varies by level)
NODE_HEIGHT: 72px            // Standard node height (varies by level)
PADDING_TOP: 60px            // Top canvas padding
PADDING_HORIZONTAL: 80px     // Left/right canvas padding
CURVE_STRENGTH: 0.4          // Bezier curve intensity
```

---

## 📏 Node Dimensions by Level

| Level | Width | Height | Border | Shadow |
|-------|-------|--------|--------|--------|
| 0 (Root) | 200px | 80px | 2px amber | md + glow |
| 1 | 180px | 72px | 1.5px strong | sm |
| 2 | 170px | 68px | 1px default | sm |
| 3+ | 160px | 64px | 1px subtle | xs |

---

## 🎨 Colors (Arbor Palette)

```css
/* Connections */
--arbor-connection: #6d665c         /* Default gray */
--arbor-connection-hover: #c9a66b   /* Amber */
--arbor-connection-active: #7d9b76  /* Sage green */

/* Accent Colors */
--arbor-primary: #7d9b76            /* Sage green */
--arbor-accent: #c9a66b             /* Warm amber */

/* Backgrounds */
--arbor-bg-raised: #211f1b          /* Node background */
--arbor-bg-elevated: #292621        /* Hover background */

/* Text */
--arbor-text-primary: #ebe6df       /* Main text */
--arbor-text-secondary: #a39b8f     /* Secondary text */
--arbor-text-tertiary: #6d665c      /* Muted text */
```

---

## 📝 Typography Scale

| Element | Size | Weight | Use Case |
|---------|------|--------|----------|
| Root Title | 14px | 600 | Root node title |
| Node Title | 13px | 500 | Standard node title |
| Deep Title | 12px | 400 | Level 3+ title |
| Platform Badge | 10px | 500 | Platform indicator |
| Level Badge | 9px | 600 | Level number |
| Connection Label | 11px | 500 | Relationship label |

---

## 🔗 Connection Line Specs

```css
/* Default */
stroke-width: 1.5px
stroke: #6d665c

/* Hover */
stroke-width: 2.5px
stroke: #c9a66b
filter: drop-shadow(0 0 4px rgba(201, 166, 107, 0.3))

/* Active */
stroke-width: 2.5px
stroke: #7d9b76
filter: drop-shadow(0 0 6px rgba(125, 155, 118, 0.4))
```

**Bezier Curve Formula:**
```
Control Point 1: (startX, startY + verticalDistance * 0.4)
Control Point 2: (endX, endY - verticalDistance * 0.4)
```

---

## 🎯 Arrow Markers

```xml
<marker id="arrow-default" markerWidth="8" markerHeight="8" 
        refX="7" refY="4" orient="auto">
  <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arbor-connection)"/>
</marker>
```

---

## 🖱️ Interaction States

| State | Visual Change | Timing |
|-------|--------------|--------|
| Hover (node) | Background → elevated, translateY(-2px) | 200ms ease-out |
| Hover (line) | Stroke width → 2.5px, color → amber | 200ms ease-out |
| Active (node) | Border → primary, add glow shadow | 150ms ease |
| Path Highlight | Highlight path to root, dim others | 150ms ease |
| Collapse | Scale(0.8), opacity 0 | 200ms ease-out |
| Expand | Scale(1), opacity 1 | 200ms ease-out |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between nodes |
| `Enter` / `Space` | Select focused node |
| `Arrow Keys` | Navigate tree structure |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom to 100% |
| `C` | Collapse/expand subtree |
| `H` | Toggle path highlight |

---

## 📍 Connection Label Position

**Position on Curve:** 40% from parent (0.4t)

**Formula:**
```typescript
x = (1-t)³ * startX + 3(1-t)²t * cp1X + 3(1-t)t² * cp2X + t³ * endX
y = (1-t)³ * startY + 3(1-t)²t * cp1Y + 3(1-t)t² * cp2Y + t³ * endY

where t = 0.4
```

---

## 🎭 Shadow System

```css
/* Elevation Levels */
--arbor-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2)      /* Default nodes */
--arbor-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25)    /* Hover, root */
--arbor-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35)    /* Modals */

/* Special */
--arbor-shadow-glow: 0 0 0 3px rgba(125, 155, 118, 0.2)  /* Focus/Active */
```

---

## 🔲 Border System

```css
/* Thickness */
--arbor-border-subtle: rgba(235, 230, 223, 0.06)   /* Level 3+ */
--arbor-border-default: rgba(235, 230, 223, 0.1)   /* Level 2 */
--arbor-border-strong: rgba(235, 230, 223, 0.16)   /* Level 1 */

/* Special Cases */
Root: 2px solid var(--arbor-accent-muted)          /* Amber */
Active: border-color: var(--arbor-primary)         /* Sage green */
```

---

## ⚡ Animation Timing

```css
/* Fast: 100ms */
transition: all 0.1s ease;
/* Use for: Button press, immediate feedback */

/* Normal: 150ms */
transition: all 0.15s ease;
/* Use for: Hover, focus, most interactions */

/* Moderate: 200ms */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
/* Use for: Node transforms, state changes */

/* Slow: 300ms */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
/* Use for: Layout changes, collapse/expand */
```

---

## 🎯 Platform Colors

```typescript
const PLATFORM_COLORS = {
  chatgpt: '#10a37f',      // OpenAI green
  gemini: '#4285f4',       // Google blue
  perplexity: '#20808d',   // Perplexity teal
};
```

---

## 📱 Zoom Configuration

```typescript
const ZOOM_CONFIG = {
  min: 0.25,      // 25%
  max: 2.0,       // 200%
  step: 0.1,      // 10% increments
  default: 1.0,   // 100%
};
```

---

## 🧮 Layout Algorithm Summary

**3-Step Process:**

1. **Assign Levels** (Y-coordinates)
   - Traverse tree depth-first
   - Assign y = paddingTop + level × levelHeight

2. **Calculate Subtree Widths**
   - Bottom-up recursion
   - Leaf nodes = nodeWidth
   - Parent = max(nodeWidth, sum(children widths + gaps))

3. **Position Nodes** (X-coordinates)
   - Top-down recursion
   - Position children left-to-right
   - Center parent over children

---

## 📦 Node HTML Structure

```html
<div class="graph-node level-{n}" data-node-id="{id}">
  <div class="graph-node-header">
    <div class="graph-node-title">{title}</div>
    <div class="graph-node-level-badge">{level}</div>
  </div>
  <div class="graph-node-body">
    <div class="graph-node-platform">
      <span class="platform-indicator"></span>
      <span class="platform-name">{platform}</span>
    </div>
  </div>
</div>
```

---

## 🔍 Path Highlighting Logic

```typescript
1. On node hover: Build path from node to root
2. Add 'path-active' class to container
3. Add 'path-highlight' class to nodes in path
4. Add 'path-highlight' class to connections in path
5. CSS dims non-highlighted elements (opacity: 0.3)
```

---

## ♿ Accessibility Requirements

| Requirement | Implementation |
|------------|----------------|
| Keyboard Navigation | Full tab order, arrow key navigation |
| Focus Indicators | Visible focus ring: 3px primary glow |
| Screen Reader | ARIA labels on all nodes and connections |
| Color Contrast | All text meets WCAG AA (4.5:1) |
| Touch Targets | Minimum 44px for interactive elements |

---

## 🎨 Root Node Special Styling

```css
.graph-node.level-0 {
  width: 200px;
  height: 80px;
  border: 2px solid var(--arbor-accent-muted);
  box-shadow: var(--arbor-shadow-md), 
              0 0 0 3px rgba(201, 166, 107, 0.12);
}

/* Amber indicator dot */
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
```

---

## 🗺️ Minimap Specs

```css
Position: bottom-right (20px from edges)
Size: 200 × 150px
Background: var(--arbor-bg)
Border: 1px solid var(--arbor-border-strong)
Border Radius: 8px
Viewport Indicator: 2px solid var(--arbor-primary)
```

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Initial Render | < 100ms for 100 nodes |
| Zoom/Pan Response | 60fps (16ms per frame) |
| Layout Calculation | < 50ms for 100 nodes |
| Memory Usage | < 10MB for 100 nodes |
| Collapse Animation | 200ms smooth |

---

## 🔧 Key CSS Classes

```css
.arbor-connections-layer    /* SVG container */
.connection-line            /* Bezier path */
.connection-label           /* Label badge on curve */
.connection-add-label       /* "+ Label" button */
.graph-node                 /* Node container */
.graph-node.level-{0-3}     /* Level-specific styles */
.graph-node.root            /* Root node */
.graph-node.active          /* Selected node */
.graph-node.collapsed       /* Collapsed subtree */
.path-highlight             /* Highlighted path element */
.graph-node-level-badge     /* Level number badge */
.platform-indicator         /* Platform color dot */
```

---

## 📋 Implementation Order

1. **Layout Algorithm** → TreeLayout class
2. **SVG Layer** → Create SVG container + markers
3. **Bezier Curves** → Replace rotated DIVs
4. **Level-Based Styling** → Size + style by depth
5. **Connection Labels** → Position on curves
6. **Path Highlighting** → Hover interaction
7. **Collapse/Expand** → Subtree toggling
8. **Minimap** → Overview navigation
9. **Polish** → Animations, accessibility

---

## 🎯 Testing Checklist

- [ ] Single node
- [ ] Linear chain (vertical alignment)
- [ ] Binary tree (parent centering)
- [ ] Unbalanced tree
- [ ] Wide tree (10+ children)
- [ ] Deep tree (10+ levels)
- [ ] Hover interactions
- [ ] Path highlighting
- [ ] Keyboard navigation
- [ ] Zoom/pan
- [ ] Performance (100+ nodes)

---

## 📚 Full Documentation

- **Complete Spec:** `TREE_VISUALIZATION_UX_SPEC.md`
- **Comparison:** `BEFORE_AFTER_COMPARISON.md`
- **Implementation:** `IMPLEMENTATION_GUIDE.md`
- **Design System:** `ARBOR_DESIGN_SYSTEM.md`

---

## 🚀 Quick Start

```bash
# 1. Read this file for quick specs
# 2. Review TREE_VISUALIZATION_UX_SPEC.md for full details
# 3. Follow IMPLEMENTATION_GUIDE.md step-by-step
# 4. Reference ARBOR_DESIGN_SYSTEM.md for colors/typography
# 5. Compare with BEFORE_AFTER_COMPARISON.md to understand transformation
```

---

**Last Updated:** 2026-01-25
**Design Version:** 1.0
**Status:** Ready for Implementation
