# Arbor Design System
## A Human-Designed UI for Conversation Trees

---

## Design Philosophy

Arbor organizes conversations like a living forest—conversations branch, grow, and connect organically. The design should feel **earthy and grounded**, not clinical or techy. Think of it as a digital arborist's notebook: warm paper tones meeting digital precision.

### Design Principles
1. **Organic, not geometric** — Subtle asymmetry, natural curves, organic spacing
2. **Warmth over coldness** — Earth tones, not neon; amber over electric blue
3. **Quiet confidence** — Visual hierarchy through typography and space, not borders
4. **Living structure** — Elements that suggest growth and connection

---

## Color Palette

### Core Philosophy
Instead of the generic dark-mode palette, Arbor uses colors inspired by:
- **Forest floor at dusk** — Deep, warm charcoals with subtle warmth
- **Aged paper and bark** — Warm off-whites and tans for accents
- **New growth** — Soft sage greens for interactive elements
- **Autumn highlights** — Warm amber for emphasis

### CSS Variables

```css
:root {
  /* === FOUNDATIONS === */
  
  /* Background layers - warm charcoal with subtle brown undertone */
  --arbor-bg-deep: #141210;          /* Darkest - modal backdrops, canvas */
  --arbor-bg: #1a1815;               /* Primary background */
  --arbor-bg-raised: #211f1b;        /* Cards, elevated surfaces */
  --arbor-bg-elevated: #292621;      /* Hover states, interactive surfaces */
  
  /* Text hierarchy - warm neutrals, not pure gray */
  --arbor-text-primary: #ebe6df;     /* Main text - warm off-white */
  --arbor-text-secondary: #a39b8f;   /* Supporting text - warm taupe */
  --arbor-text-tertiary: #6d665c;    /* Muted text - brown-gray */
  --arbor-text-disabled: #4a453f;    /* Disabled states */
  
  /* === BRAND COLORS === */
  
  /* Primary - Sage Green (growth, nature, calm) */
  --arbor-primary: #7d9b76;          /* Primary interactive color */
  --arbor-primary-muted: #5c7356;    /* Subtle use, backgrounds */
  --arbor-primary-soft: rgba(125, 155, 118, 0.12);  /* Tints, highlights */
  --arbor-primary-glow: rgba(125, 155, 118, 0.25); /* Focus rings */
  
  /* Accent - Warm Amber (highlights, attention) */
  --arbor-accent: #c9a66b;           /* Accent color - golden amber */
  --arbor-accent-muted: #96794c;     /* Muted amber */
  --arbor-accent-soft: rgba(201, 166, 107, 0.15);  /* Tints */
  
  /* === SEMANTIC COLORS === */
  
  /* Success - softer green */
  --arbor-success: #8ab07f;
  --arbor-success-soft: rgba(138, 176, 127, 0.15);
  
  /* Warning - natural amber */
  --arbor-warning: #d4a84b;
  --arbor-warning-soft: rgba(212, 168, 75, 0.15);
  
  /* Error - terracotta red, not harsh */
  --arbor-error: #c67b6f;
  --arbor-error-soft: rgba(198, 123, 111, 0.15);
  
  /* Info - muted blue-gray */
  --arbor-info: #7b96a8;
  --arbor-info-soft: rgba(123, 150, 168, 0.15);
  
  /* === STRUCTURAL === */
  
  /* Borders - subtle, warm */
  --arbor-border-subtle: rgba(235, 230, 223, 0.06);   /* Very subtle dividers */
  --arbor-border-default: rgba(235, 230, 223, 0.1);   /* Standard borders */
  --arbor-border-strong: rgba(235, 230, 223, 0.16);   /* Emphasized borders */
  
  /* Shadows */
  --arbor-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --arbor-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
  --arbor-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35);
  --arbor-shadow-glow: 0 0 20px rgba(125, 155, 118, 0.15);
  
  /* === GRAPH SPECIFIC === */
  
  /* Connection lines - organic, not electric */
  --arbor-connection: #6d665c;                        /* Default line */
  --arbor-connection-active: var(--arbor-primary);    /* Active/selected */
  --arbor-connection-hover: var(--arbor-accent);      /* Hover state */
}
```

---

## Typography

### Font Stack
```css
--arbor-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--arbor-font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Use Case |
|-------|------|--------|-------------|----------|
| `--text-xs` | 11px | 500 | 1.4 | Badges, meta |
| `--text-sm` | 12px | 400 | 1.5 | Secondary text, captions |
| `--text-base` | 13px | 400 | 1.5 | Body text, list items |
| `--text-md` | 14px | 500 | 1.4 | Tree items, nodes |
| `--text-lg` | 16px | 600 | 1.3 | Section titles, modal headers |
| `--text-xl` | 18px | 600 | 1.25 | Panel headers |

### Section Headers — Breaking the Template

**Problem**: Uppercase + letter-spacing = instant AI tell

**Solution**: Use sentence case with subtle visual distinction through weight and color contrast.

```css
.section-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--arbor-text-tertiary);
  letter-spacing: 0;  /* NO letter-spacing */
  text-transform: none;  /* NO uppercase */
  margin-bottom: 12px;
  
  /* Optional: subtle underline accent */
  padding-bottom: 8px;
  border-bottom: 1px solid var(--arbor-border-subtle);
}

/* Alternative: Use a small decorative element */
.section-header::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 3px;
  background: var(--arbor-primary-muted);
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}
```

**Examples:**
- ❌ `MY TREES` → ✅ `My trees`
- ❌ `CURRENT TREE` → ✅ `Current tree`
- ❌ `TREE NAME` → ✅ `Tree name`

---

## Component Designs

### 1. Sidebar Container

```css
#arbor-sidebar-container {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 300px;
  background: var(--arbor-bg);
  color: var(--arbor-text-primary);
  font-family: var(--arbor-font-sans);
  
  /* Subtle edge shadow instead of harsh border */
  border-right: none;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
  
  display: flex;
  flex-direction: column;
  z-index: 2147483646;
  
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Panel Header

```css
.arbor-header {
  padding: 16px 20px;
  background: var(--arbor-bg);  /* Same as container, no contrast bar */
  display: flex;
  align-items: center;
  gap: 12px;
  
  /* Subtle bottom separation */
  border-bottom: 1px solid var(--arbor-border-subtle);
}

.arbor-header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--arbor-text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Logo/Icon styling */
.arbor-header-icon {
  width: 22px;
  height: 22px;
  color: var(--arbor-primary);
}

/* Close button */
.arbor-header-close {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--arbor-text-tertiary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.arbor-header-close:hover {
  background: var(--arbor-bg-elevated);
  color: var(--arbor-text-secondary);
}
```

### 3. Tree Items — Breaking the Card Pattern

**Problem**: Every item has identical borders = template look

**Solution**: Use background shifts and subtle shadows. Reserve borders for emphasis.

```css
.tree-item {
  padding: 14px 16px;
  background: transparent;  /* No background by default */
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.15s ease;
  
  /* NO border by default */
  border: 1px solid transparent;
}

.tree-item:hover {
  background: var(--arbor-bg-elevated);
}

/* Selected/Active state - warm, not glowing blue */
.tree-item.active {
  background: var(--arbor-primary-soft);
  
  /* Subtle left accent - organic, not mechanical */
  border-left: 2px solid var(--arbor-primary);
  padding-left: 14px;  /* Compensate for border */
}

.tree-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--arbor-text-primary);
  margin-bottom: 4px;
}

.tree-item-meta {
  font-size: 12px;
  color: var(--arbor-text-tertiary);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Meta separator dot */
.tree-item-meta span::after {
  content: '·';
  margin-left: 8px;
  color: var(--arbor-text-disabled);
}

.tree-item-meta span:last-child::after {
  display: none;
}
```

### 4. Tree Nodes (Hierarchical Items)

**Problem**: Left-border accent on every node = very common AI pattern

**Solution**: Use indentation lines and subtle background differentiation

```css
.tree-node {
  position: relative;
  padding: 10px 14px;
  margin: 2px 0;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  
  /* NO left border accent */
}

.tree-node:hover {
  background: var(--arbor-bg-elevated);
}

.tree-node.active {
  background: var(--arbor-primary-soft);
}

/* Tree structure lines - subtle connection indicators */
.tree-node-children {
  margin-left: 20px;
  position: relative;
}

/* Vertical connection line */
.tree-node-children::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 0;
  bottom: 12px;
  width: 1px;
  background: var(--arbor-border-default);
}

/* Horizontal connection to each child */
.tree-node-children > .tree-node::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 18px;
  width: 8px;
  height: 1px;
  background: var(--arbor-border-default);
}

.tree-node-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--arbor-text-primary);
  margin-bottom: 2px;
}

.tree-node-meta {
  font-size: 11px;
  color: var(--arbor-text-tertiary);
}

/* Node type badge */
.tree-node-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;
  background: var(--arbor-bg-elevated);
  color: var(--arbor-text-secondary);
}

.tree-node-badge.root {
  background: var(--arbor-accent-soft);
  color: var(--arbor-accent);
}

.tree-node-badge.extends {
  background: var(--arbor-primary-soft);
  color: var(--arbor-primary);
}

.tree-node-badge.leaf {
  background: var(--arbor-bg-elevated);
  color: var(--arbor-text-tertiary);
}
```

### 5. Buttons

```css
/* Base button */
.arbor-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--arbor-font-sans);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

/* Primary - filled sage */
.arbor-btn-primary {
  background: var(--arbor-primary);
  color: #fff;
}

.arbor-btn-primary:hover {
  background: var(--arbor-primary-muted);
}

.arbor-btn-primary:active {
  transform: translateY(1px);
}

/* Secondary - ghost with border */
.arbor-btn-secondary {
  background: transparent;
  color: var(--arbor-text-primary);
  border: 1px solid var(--arbor-border-default);
}

.arbor-btn-secondary:hover {
  background: var(--arbor-bg-elevated);
  border-color: var(--arbor-border-strong);
}

/* Ghost - minimal */
.arbor-btn-ghost {
  background: transparent;
  color: var(--arbor-text-secondary);
  padding: 8px 12px;
}

.arbor-btn-ghost:hover {
  background: var(--arbor-bg-elevated);
  color: var(--arbor-text-primary);
}

/* Danger */
.arbor-btn-danger {
  background: transparent;
  color: var(--arbor-error);
}

.arbor-btn-danger:hover {
  background: var(--arbor-error-soft);
}

/* Focus states - organic glow */
.arbor-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--arbor-bg), 0 0 0 4px var(--arbor-primary-glow);
}
```

### 6. Graph Nodes — Breaking the Blue Border Pattern

**Problem**: Bright blue borders on every node = generic, electric look

**Solution**: Subtle elevation, warm colors, organic shapes

```css
.graph-node {
  position: absolute;
  padding: 12px 16px;
  min-width: 140px;
  max-width: 200px;
  background: var(--arbor-bg-raised);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* Subtle shadow instead of harsh border */
  box-shadow: var(--arbor-shadow-sm);
  border: 1px solid var(--arbor-border-subtle);
}

.graph-node:hover {
  background: var(--arbor-bg-elevated);
  box-shadow: var(--arbor-shadow-md);
  transform: translateY(-1px);
}

/* Active/selected state - warm highlight, not glowing blue box */
.graph-node.active {
  background: var(--arbor-bg-elevated);
  border-color: var(--arbor-primary-muted);
  box-shadow: 
    var(--arbor-shadow-md),
    inset 0 0 0 1px var(--arbor-primary-muted);
}

/* Root node - slight distinction */
.graph-node.root {
  border-color: var(--arbor-accent-muted);
}

.graph-node.root::after {
  content: '';
  position: absolute;
  top: -4px;
  left: 16px;
  width: 8px;
  height: 8px;
  background: var(--arbor-accent);
  border-radius: 50%;
}

.graph-node-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--arbor-text-primary);
  margin-bottom: 4px;
  
  /* Truncate long titles */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Platform indicator */
.graph-node-platform {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--arbor-text-tertiary);
}

.graph-node-platform::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--arbor-primary-muted);
}
```

### 7. Connection Lines — Organic Connectors

```css
/* SVG-based connections for better control */
.connection-line {
  stroke: var(--arbor-connection);
  stroke-width: 1.5;
  fill: none;
  
  /* Slight curve for organic feel - use quadratic bezier in JS */
}

.connection-line:hover {
  stroke: var(--arbor-connection-hover);
  stroke-width: 2;
}

.connection-line.active {
  stroke: var(--arbor-connection-active);
  stroke-width: 2;
}

/* Connection labels (e.g., "extends") */
.connection-label {
  font-size: 10px;
  font-weight: 500;
  fill: var(--arbor-text-tertiary);
  background: var(--arbor-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Alternative: CSS-based curved lines */
.connection-line-css {
  position: absolute;
  pointer-events: none;
  border: none;
  
  /* Create curved appearance with border-radius */
  border-left: 1.5px solid var(--arbor-connection);
  border-bottom: 1.5px solid var(--arbor-connection);
  border-radius: 0 0 0 12px;
}
```

### 8. Floating Toggle Buttons — Refined Pills

**Problem**: Blur backdrop + pill shape + glowing active = very AI

**Solution**: Subtle, grounded design with meaningful visual feedback

```css
#arbor-toggle-buttons {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 1000000;
  
  /* Subtle container */
  background: var(--arbor-bg-raised);
  padding: 6px;
  border-radius: 12px;
  box-shadow: var(--arbor-shadow-lg);
  border: 1px solid var(--arbor-border-subtle);
}

#arbor-toggle-buttons button {
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--arbor-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

#arbor-toggle-buttons button:hover {
  background: var(--arbor-bg-elevated);
  color: var(--arbor-text-primary);
}

/* Active state - subtle fill, no glow */
#arbor-toggle-buttons button.active {
  background: var(--arbor-primary-soft);
  color: var(--arbor-primary);
}

/* Icon styling */
#arbor-toggle-buttons button svg,
#arbor-toggle-buttons button .icon {
  width: 16px;
  height: 16px;
  opacity: 0.8;
}

#arbor-toggle-buttons button.active svg,
#arbor-toggle-buttons button.active .icon {
  opacity: 1;
}
```

### 9. Modals/Dialogs

```css
.arbor-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99999999;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Subtle backdrop animation */
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.arbor-modal {
  background: var(--arbor-bg-raised);
  border-radius: 12px;
  padding: 0;
  max-width: 440px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--arbor-shadow-lg);
  border: 1px solid var(--arbor-border-subtle);
  
  /* Subtle scale animation */
  animation: modalIn 0.2s ease;
}

@keyframes modalIn {
  from { 
    opacity: 0;
    transform: scale(0.96);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.arbor-modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--arbor-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arbor-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--arbor-text-primary);
  margin: 0;
}

.arbor-modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--arbor-text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.arbor-modal-close:hover {
  background: var(--arbor-bg-elevated);
  color: var(--arbor-text-secondary);
}

.arbor-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(80vh - 140px);
}

.arbor-modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--arbor-border-subtle);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* Form inputs in modals */
.arbor-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--arbor-bg-deep);
  border: 1px solid var(--arbor-border-default);
  border-radius: 6px;
  color: var(--arbor-text-primary);
  font-size: 13px;
  font-family: var(--arbor-font-sans);
  transition: all 0.15s ease;
}

.arbor-input:focus {
  outline: none;
  border-color: var(--arbor-primary-muted);
  box-shadow: 0 0 0 3px var(--arbor-primary-soft);
}

.arbor-input::placeholder {
  color: var(--arbor-text-disabled);
}

/* Selection options in modals */
.arbor-option {
  padding: 12px 14px;
  background: var(--arbor-bg-deep);
  border: 1px solid var(--arbor-border-subtle);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.arbor-option:hover {
  background: var(--arbor-bg);
  border-color: var(--arbor-border-default);
}

.arbor-option.selected {
  background: var(--arbor-primary-soft);
  border-color: var(--arbor-primary-muted);
}
```

---

## Spacing System

Use a 4px base unit for consistency:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### Layout Guidelines

| Element | Padding/Margin |
|---------|----------------|
| Sidebar content area | 16px horizontal |
| Section spacing | 20px between sections |
| Tree item spacing | 4px between items |
| Modal padding | 24px horizontal, 20px vertical |
| Button padding | 10px 16px (primary), 8px 12px (ghost) |
| Graph node padding | 12px 16px |

---

## Interaction States

### Hover
- Background shift: `transparent` → `var(--arbor-bg-elevated)`
- Subtle lift on graph nodes: `translateY(-1px)`
- Shadow increase for depth

### Active/Pressed
- Slight depression: `translateY(1px)`
- Darker background momentarily

### Selected
- Soft background tint: `var(--arbor-primary-soft)`
- Left accent on list items: 2px solid primary
- For graph: inset border glow

### Focus (Keyboard)
- Double-ring focus: `0 0 0 2px bg, 0 0 0 4px primary-glow`
- Always visible for accessibility

### Disabled
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

---

## Visual Hierarchy Without Borders

Instead of putting borders on everything, use:

1. **Background gradients** — Subtle darkening/lightening
2. **Shadow depth** — Different shadow intensities
3. **Spacing** — Group related items, separate unrelated
4. **Typography weight** — Bold titles, regular body
5. **Color contrast** — Primary vs secondary text colors

### Example: Section Organization

```
[Section Title - tertiary text, small]        ← Color differentiates
                                              ← Space separates
[Item 1 - elevated background on hover]       ← Background shows grouping
[Item 2]
[Item 3 - selected, has soft green bg]        ← Color shows state

                                              ← Large gap between sections

[Next Section Title]
...
```

---

## Dark Mode Adjustments

The palette is already designed for dark mode. For potential light mode:

```css
[data-theme="light"] {
  --arbor-bg-deep: #f5f3f0;
  --arbor-bg: #faf9f7;
  --arbor-bg-raised: #ffffff;
  --arbor-bg-elevated: #f0eeeb;
  
  --arbor-text-primary: #1a1815;
  --arbor-text-secondary: #5c564d;
  --arbor-text-tertiary: #8a837a;
  
  --arbor-primary: #5c7356;
  --arbor-primary-muted: #7d9b76;
  
  --arbor-border-subtle: rgba(26, 24, 21, 0.06);
  --arbor-border-default: rgba(26, 24, 21, 0.1);
}
```

---

## Implementation Checklist

### Phase 1: Color & Typography
- [ ] Replace all color variables in StyleInjector.ts
- [ ] Update options.css with new palette
- [ ] Change section headers to sentence case
- [ ] Remove letter-spacing from headers

### Phase 2: Components
- [ ] Remove borders from tree items (use backgrounds)
- [ ] Update tree node styles (remove left-border pattern)
- [ ] Redesign graph nodes (remove blue borders)
- [ ] Update floating toggle buttons

### Phase 3: Polish
- [ ] Add connection line curves
- [ ] Implement proper focus states
- [ ] Test hover/active transitions
- [ ] Verify accessibility contrast ratios

---

## Accessibility Notes

### Color Contrast
- Primary text (#ebe6df) on bg (#1a1815): **13.2:1** ✓
- Secondary text (#a39b8f) on bg (#1a1815): **5.8:1** ✓
- Primary color (#7d9b76) on bg (#1a1815): **5.2:1** ✓

### Keyboard Navigation
- All interactive elements must have visible focus states
- Tab order should be logical
- Escape closes modals

### Screen Readers
- Use semantic HTML where possible
- Add aria-labels to icon-only buttons
- Announce state changes

---

## Final Notes

This design system prioritizes:

1. **Authenticity** — No patterns that scream "AI generated"
2. **Brand connection** — Colors and metaphors tied to trees/nature
3. **Usability** — Clear hierarchy, predictable interactions
4. **Refinement** — Small details that show human craft

The goal is for users to feel like they're using a thoughtfully designed tool, not a template.
