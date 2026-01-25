# UX Design: Authentic Arbor Extension UI

## Design Philosophy

**Goal**: Create a UI that feels handcrafted, intentional, and authentic - not AI-generated.

**Principles**:
- **Minimalism**: Less is more. Remove decorative elements that don't serve a purpose.
- **Consistency**: Establish clear patterns and stick to them.
- **Subtlety**: Small, thoughtful details over flashy effects.
- **Clarity**: Every element should have a clear purpose.

## Color Palette

### Primary Colors
- **Background**: `#0f1115` (Deep, rich dark - not pure black)
- **Surface**: `#1a1d23` (Slightly lighter for cards/panels)
- **Border**: `#2a2d35` (Subtle separation, not harsh)

### Accent Colors
- **Primary Accent**: `#5b8af0` (Soft blue - professional, not teal)
- **Success**: `#4ade80` (Subtle green)
- **Warning**: `#fbbf24` (Amber)
- **Error**: `#f87171` (Soft red)

### Text Colors
- **Primary Text**: `#e4e7eb` (High contrast, readable)
- **Secondary Text**: `#9ca3af` (Muted for metadata)
- **Tertiary Text**: `#6b7280` (Very muted)

## Typography System

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
```

### Type Scale
- **H1**: 20px / 600 weight / 1.2 line-height
- **H2**: 16px / 600 weight / 1.3 line-height
- **H3**: 14px / 600 weight / 1.4 line-height
- **Body**: 14px / 400 weight / 1.5 line-height
- **Small**: 12px / 400 weight / 1.4 line-height
- **Caption**: 11px / 400 weight / 1.4 line-height

## Spacing System

4px base unit:
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 32px

## Component Design

### Sidebar Container
- **Width**: 320px (fixed)
- **Background**: `#0f1115`
- **Border**: Right border `1px solid #2a2d35`
- **Shadow**: Subtle right shadow for depth
- **Padding**: 0 (content sections handle their own padding)

### Header
- **Height**: 56px
- **Background**: `#1a1d23`
- **Border**: Bottom `1px solid #2a2d35`
- **Padding**: 16px 20px
- **Logo**: Text only, no emoji. Font size 18px, weight 600
- **Close Button**: Icon-only, subtle hover state

### Content Area
- **Padding**: 16px 20px per section
- **Scroll**: Smooth, subtle scrollbar styling
- **Sections**: Separated by subtle dividers

### Tree List Item
- **Padding**: 12px 16px
- **Background**: `#1a1d23`
- **Border**: `1px solid #2a2d35`
- **Border Radius**: 6px
- **Margin**: 0 0 8px 0
- **Hover**: Background `#22252b`, border `#2a2d35`
- **Active**: Background `#1e3a5f`, border `#5b8af0` (subtle blue tint)

### Tree Node (in tree view)
- **Padding**: 10px 12px
- **Background**: `#1a1d23`
- **Border**: Left `2px solid #5b8af0`
- **Border Radius**: 4px
- **Margin**: 4px 0
- **Indent**: 16px per level
- **Hover**: Background `#22252b`

### Buttons

#### Primary Button
- **Background**: `#5b8af0`
- **Color**: `#ffffff`
- **Padding**: 10px 16px
- **Border Radius**: 6px
- **Font**: 14px / 600
- **Hover**: Background `#4a7ae0`
- **Active**: Background `#3a6ad0`
- **No gradients, no shadows**

#### Secondary Button
- **Background**: `#1a1d23`
- **Color**: `#e4e7eb`
- **Border**: `1px solid #2a2d35`
- **Padding**: 10px 16px
- **Border Radius**: 6px
- **Font**: 14px / 600
- **Hover**: Background `#22252b`, border `#3a3d45`

#### Ghost Button (for close/edit)
- **Background**: Transparent
- **Color**: `#9ca3af`
- **Padding**: 6px 8px
- **Border Radius**: 4px
- **Font**: 12px / 500
- **Hover**: Background `#1a1d23`, color `#e4e7eb`

### Empty State
- **Padding**: 48px 24px
- **Text Align**: Center
- **Icon**: Subtle icon (no emoji), 32px, color `#6b7280`
- **Title**: 16px / 600, color `#e4e7eb`, margin-top 16px
- **Description**: 14px / 400, color `#9ca3af`, margin-top 8px

### Section Headers
- **Font**: 11px / 600
- **Color**: `#9ca3af`
- **Text Transform**: Uppercase
- **Letter Spacing**: 0.05em
- **Margin**: 0 0 12px 0
- **No emojis**

### Input Fields
- **Background**: `#1a1d23`
- **Border**: `1px solid #2a2d35`
- **Border Radius**: 6px
- **Padding**: 10px 12px
- **Color**: `#e4e7eb`
- **Font**: 14px
- **Focus**: Border `#5b8af0`, outline `2px solid rgba(91, 138, 240, 0.1)`

### Modal/Dialog
- **Background**: `#1a1d23`
- **Border**: `1px solid #2a2d35`
- **Border Radius**: 12px
- **Padding**: 24px
- **Max Width**: 480px
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.4)`
- **Backdrop**: `rgba(0, 0, 0, 0.7)` with blur

## Interaction Patterns

### Hover States
- **Duration**: 150ms
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Changes**: Background color, border color (subtle)
- **No transforms, no shadows**

### Active States
- **Duration**: 100ms
- **Visual**: Slightly darker background
- **No scale transforms**

### Focus States
- **Outline**: 2px solid with 10% opacity of accent color
- **Offset**: 2px
- **Always visible for accessibility**

## Visual Hierarchy

1. **Primary Actions**: Primary button style, prominent placement
2. **Secondary Actions**: Secondary button style, less prominent
3. **Tertiary Actions**: Ghost button style, subtle
4. **Content**: Clear typography hierarchy
5. **Metadata**: Muted colors, smaller text

## Removing AI-Generated Patterns

### ❌ Remove:
- All emojis from functional UI
- Gradient backgrounds (except subtle accents)
- Generic "modern" shadows
- Over-animated hover effects
- Decorative elements without purpose
- Generic color schemes
- Inline styles

### ✅ Add:
- Consistent spacing system
- Clear typography hierarchy
- Subtle, purposeful interactions
- Unique but professional color palette
- CSS classes instead of inline styles
- Semantic HTML structure

## Responsive Considerations

- Sidebar: Fixed width on desktop, can be collapsed
- Mobile: Consider bottom sheet pattern for actions
- Touch targets: Minimum 44px height
- Text: Readable at all sizes (minimum 12px)

## Accessibility

- **Color Contrast**: All text meets WCAG AA (4.5:1)
- **Focus Indicators**: Always visible
- **Keyboard Navigation**: Full support
- **Screen Readers**: Semantic HTML, ARIA labels where needed
- **Touch Targets**: Minimum 44px
