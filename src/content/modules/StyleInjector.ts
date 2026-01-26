/**
 * StyleInjector - Handles CSS injection for Arbor extension
 */

export class StyleInjector {
  private static injected = false;

  static inject() {
    if (this.injected || document.getElementById("arbor-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "arbor-styles";
    style.textContent = this.getStyles();
    document.head.appendChild(style);
    this.injected = true;
  }

  private static getStyles(): string {
    return `
      /* Arbor Design System Variables */
      :root {
        /* Backgrounds — warm charcoal tones */
        --arbor-bg-deep: #141210;
        --arbor-bg: #1a1815;
        --arbor-bg-raised: #211e1a;
        --arbor-bg-elevated: #292520;
        
        /* Primary — sage green (nature/growth) */
        --arbor-primary: #7d9b76;
        --arbor-primary-soft: rgba(125, 155, 118, 0.12);
        --arbor-primary-muted: #5a7255;
        
        /* Accent — warm amber */
        --arbor-accent: #c9a66b;
        --arbor-accent-soft: rgba(201, 166, 107, 0.15);
        
        /* Semantic */
        --arbor-success: #6b9b72;
        --arbor-warning: #c9a857;
        --arbor-error: #b86b6b;
        
        /* Text — warm tones with improved contrast for WCAG AA */
        --arbor-text-primary: #f0ebe4;
        --arbor-text-secondary: #b5ada0;
        --arbor-text-tertiary: #857c70;
        
        /* Borders */
        --arbor-border-subtle: #2a2622;
        --arbor-border-default: #352f29;
        --arbor-border-strong: #453d35;
        
        /* Shadows */
        --arbor-shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
        --arbor-shadow-md: 0 4px 8px rgba(0,0,0,0.25);
        --arbor-shadow-lg: 0 8px 24px rgba(0,0,0,0.35);
      }

      /* Base Container Styles */
      #arbor-sidebar-container,
      #arbor-graph-container {
        position: fixed;
        top: 0;
        height: 100vh;
        background: var(--arbor-bg);
        color: var(--arbor-text-primary);
        z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #arbor-sidebar-container {
        left: 0;
        width: 320px;
        border-right: 1px solid var(--arbor-border-subtle);
        transform: translateX(0);
      }
      
      #arbor-sidebar-container.hidden {
        transform: translateX(-100%);
      }

      #arbor-graph-container {
        right: 0;
        width: 400px;
        transform: translateX(0);
      }
      
      #arbor-graph-container.hidden {
        transform: translateX(100%);
      }

      #arbor-graph-container #graph-canvas {
        overflow: auto !important;
        cursor: default;
        scroll-behavior: smooth;
      }
      
      #arbor-graph-container #graph-content {
        position: relative;
        transform-origin: 0 0;
      }

      /* Header */
      .arbor-header {
        height: 56px;
        background: var(--arbor-bg-raised);
        border-bottom: 1px solid var(--arbor-border-subtle);
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .arbor-header h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--arbor-text-primary);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      /* Brand Text - Stylish "Arbor" wordmark */
      .arbor-brand-text {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, var(--arbor-primary) 0%, var(--arbor-accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
        flex-shrink: 0;
        user-select: none;
        position: relative;
      }

      .arbor-brand-text::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--arbor-primary) 0%, transparent 100%);
        opacity: 0.3;
      }

      .arbor-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .arbor-header-actions .arbor-btn {
        display: flex;
        align-items: center;
        white-space: nowrap;
      }

      /* Icon-only buttons for headers */
      .arbor-icon-btn {
        width: 32px;
        height: 32px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--arbor-text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
      }

      .arbor-icon-btn:hover {
        background: var(--arbor-bg-elevated);
        color: var(--arbor-text-primary);
      }

      .arbor-icon-btn:active {
        transform: scale(0.95);
      }

      /* Tooltip styles for buttons */
      [data-tooltip] {
        position: relative;
      }

      [data-tooltip]:hover::before {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--arbor-bg-raised);
        color: var(--arbor-text-primary);
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        box-shadow: var(--arbor-shadow-lg);
        border: 1px solid var(--arbor-border-default);
        opacity: 0;
        animation: tooltipFadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      [data-tooltip]:hover::after {
        content: '';
        position: absolute;
        bottom: calc(100% + 2px);
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid var(--arbor-bg-raised);
        z-index: 10001;
        pointer-events: none;
        opacity: 0;
        animation: tooltipFadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      /* Tooltip positioning for buttons on the right side */
      .arbor-header-actions [data-tooltip]:hover::before,
      .arbor-graph-header-actions [data-tooltip]:hover::before {
        left: auto;
        right: 0;
        transform: none;
      }

      .arbor-header-actions [data-tooltip]:hover::after,
      .arbor-graph-header-actions [data-tooltip]:hover::after {
        left: auto;
        right: 8px;
        transform: none;
      }

      /* Content Area */
      .arbor-content {
        flex: 1;
        overflow-y: auto;
        background: var(--arbor-bg);
      }

      .arbor-section {
        padding: 16px 20px;
      }

      .arbor-section-divider {
        border-top: 1px solid var(--arbor-border-subtle);
      }

      /* Section Headers — uppercase for clear hierarchy */
      .arbor-section-header {
        font-size: 12px;
        font-weight: 600;
        color: var(--arbor-text-tertiary);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }

      /* Tree Dropdown Chevron */
      .arbor-tree-dropdown-chevron,
      .arbor-tree-info-chevron {
        flex-shrink: 0;
        color: var(--arbor-text-tertiary);
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        width: 12px;
        height: 12px;
      }

      #tree-selector[aria-expanded="true"] .arbor-tree-dropdown-chevron,
      #tree-selector[aria-expanded="true"] .arbor-tree-info-chevron {
        transform: rotate(180deg);
      }

      @keyframes dropdownSlideIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .arbor-tree-dropdown-search {
        padding: 8px;
        border-bottom: 1px solid var(--arbor-border-subtle);
      }

      .arbor-tree-dropdown-search-input {
        width: 100%;
        background: var(--arbor-bg);
        border: 1px solid var(--arbor-border-default);
        border-radius: 6px;
        padding: 8px 10px;
        color: var(--arbor-text-primary);
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
      }

      .arbor-tree-dropdown-search-input:focus {
        outline: none;
        border-color: var(--arbor-primary);
        box-shadow: 0 0 0 2px var(--arbor-primary-soft);
      }

      .arbor-tree-dropdown-list {
        max-height: 250px;
        overflow-y: auto;
      }

      .arbor-tree-dropdown-item {
        padding: 12px;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 44px;
        border-radius: 4px;
        margin: 2px 4px;
      }

      .arbor-tree-dropdown-item:hover {
        background: var(--arbor-bg-elevated);
        box-shadow: 0 0 0 1px var(--arbor-border-default);
      }

      .arbor-tree-dropdown-item:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
        background: var(--arbor-bg-elevated);
      }

      .arbor-tree-dropdown-item.active {
        background: var(--arbor-primary-soft);
        box-shadow: 0 0 0 1px var(--arbor-primary-muted);
      }

      .arbor-tree-dropdown-item-content {
        flex: 1;
        min-width: 0;
      }

      .arbor-tree-dropdown-item-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arbor-tree-dropdown-item-meta {
        font-size: 11px;
        color: var(--arbor-text-tertiary);
      }

      .arbor-tree-dropdown-check {
        flex-shrink: 0;
        color: var(--arbor-primary);
      }

      .arbor-tree-dropdown-footer {
        border-top: 1px solid var(--arbor-border-subtle);
        padding: 8px;
      }

      .arbor-tree-dropdown-new {
        width: 100%;
        background: transparent;
        border: 1px dashed var(--arbor-border-default);
        border-radius: 6px;
        padding: 8px 12px;
        color: var(--arbor-text-secondary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-tree-dropdown-new:hover {
        background: var(--arbor-bg-elevated);
        border-color: var(--arbor-primary);
        color: var(--arbor-primary);
      }

      /* Collapsible Sections */
      .arbor-collapsible-section {
        margin-bottom: 4px;
      }

      .arbor-collapsible-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        cursor: pointer;
        user-select: none;
      }

      .arbor-collapsible-chevron {
        background: transparent;
        border: none;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--arbor-text-tertiary);
        cursor: pointer;
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
      }

      .arbor-collapsible-chevron[aria-expanded="false"] {
        transform: rotate(-90deg);
      }

      .arbor-collapsible-actions {
        display: flex;
        gap: 4px;
        margin-left: auto;
        opacity: 0;
        transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
      }

      .arbor-collapsible-header:hover .arbor-collapsible-actions {
        opacity: 1;
      }

      .arbor-action-btn {
        background: transparent;
        border: none;
        padding: 8px;
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--arbor-text-secondary);
        cursor: pointer;
        border-radius: 6px;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
        position: relative;
      }

      /* Tooltip positioning for action buttons */
      .arbor-collapsible-actions [data-tooltip]:hover::before {
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        white-space: normal;
        max-width: 200px;
        text-align: center;
      }

      .arbor-action-btn:hover {
        background: var(--arbor-bg-elevated);
        color: var(--arbor-text-primary);
      }

      .arbor-action-btn:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
      }

      .arbor-delete-tree-btn:hover {
        color: var(--arbor-error);
        background: rgba(184, 107, 107, 0.1);
      }

      .arbor-collapsible-content {
        overflow: hidden;
        transition: max-height 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-collapsible-content[aria-hidden="true"] {
        max-height: 0 !important;
        opacity: 0;
      }

      /* Tree Info Card — Distinguished box for current tree title with dropdown integration */
      .arbor-tree-info-card {
        width: 100%;
        text-align: left;
        background: var(--arbor-bg-elevated);
        border: 1.5px solid var(--arbor-border-strong);
        border-left: 3px solid var(--arbor-accent);
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--arbor-shadow-sm);
        position: relative;
        cursor: pointer;
        color: inherit;
        font-family: inherit;
        font-size: inherit;
      }

      .arbor-tree-info-card:hover {
        background: var(--arbor-bg-raised);
        border-left-color: var(--arbor-primary);
        box-shadow: var(--arbor-shadow-md);
        transform: translateY(-1px);
      }

      .arbor-tree-info-card:active {
        transform: scale(0.99);
      }

      .arbor-tree-info-card:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
      }

      .arbor-tree-info-icon {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        border-radius: 8px;
        background: var(--arbor-primary-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--arbor-primary);
        flex-shrink: 0;
        transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 18px;
      }

      .arbor-tree-info-card:hover .arbor-tree-info-icon {
        background: rgba(125, 155, 118, 0.18);
        transform: scale(1.05);
      }

      .arbor-tree-info-emoji {
        line-height: 1;
      }

      .arbor-tree-info-chevron {
        flex-shrink: 0;
        color: var(--arbor-text-tertiary);
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        margin-left: auto;
      }

      .arbor-tree-info-card[aria-expanded="true"] .arbor-tree-info-chevron {
        transform: rotate(180deg);
      }

      .arbor-tree-info-content {
        flex: 1;
        min-width: 0;
      }

      .arbor-tree-info-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--arbor-text-primary);
        margin-bottom: 6px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.3;
      }

      .arbor-tree-info-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--arbor-text-tertiary);
      }

      .arbor-tree-info-badge {
        font-weight: 500;
      }

      .arbor-tree-info-separator {
        opacity: 0.5;
      }

      /* Dropdown wrapper for positioning */
      .arbor-tree-dropdown-wrapper {
        position: relative;
        margin-bottom: 16px;
      }

      .arbor-tree-dropdown-menu {
        position: absolute !important;
        top: calc(100% + 4px) !important;
        left: 0;
        right: 0;
        z-index: 1000;
        background: var(--arbor-bg-raised);
        border: 1px solid var(--arbor-border-default);
        border-radius: 8px;
        box-shadow: var(--arbor-shadow-lg);
        overflow: hidden;
        animation: dropdownSlideIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Tree Children Container */
      .arbor-tree-children-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      /* Empty tree message */
      .arbor-empty-tree-message {
        padding: 24px 16px;
        text-align: center;
        color: var(--arbor-text-tertiary);
        font-size: 13px;
        line-height: 1.5;
        background: var(--arbor-bg-raised);
        border: 1px dashed var(--arbor-border-default);
        border-radius: 8px;
        margin-top: 8px;
      }

      /* Tree Node Cards — Card-styled children with visual hierarchy */
      .tree-node-card {
        background: var(--arbor-bg-elevated);
        border: 1px solid var(--arbor-border-default);
        border-left: 2px solid var(--arbor-primary);
        border-radius: 6px;
        padding: 8px 10px;
        margin: 0;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--arbor-shadow-sm);
        position: relative;
      }

      .tree-node-card:hover {
        background: var(--arbor-bg-raised);
        border-left-color: var(--arbor-primary-muted);
        box-shadow: var(--arbor-shadow-md);
        transform: translateX(2px);
      }

      .tree-node-card:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
        background: var(--arbor-bg-raised);
      }

      /* First-level children (direct children of root) have more prominence */
      .tree-node-card-depth-0 {
        border-left-width: 2.5px;
        padding: 9px 12px;
      }

      .tree-node-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tree-node-card-content {
        flex: 1;
        min-width: 0;
      }

      /* Dragging states for cards */
      .tree-node-card.draggable {
        cursor: grab;
        user-select: none;
      }

      .tree-node-card.dragging {
        cursor: grabbing !important;
        opacity: 0.5;
        background: var(--arbor-bg-elevated);
        box-shadow: var(--arbor-shadow-lg);
        transform: scale(0.95) rotate(1deg);
        border: 2px dashed var(--arbor-primary);
      }

      .tree-node-card[draggable="true"]:active {
        cursor: grabbing !important;
      }

      .tree-node-card.drag-over {
        background: rgba(125, 155, 118, 0.15);
        box-shadow: 0 0 0 2px var(--arbor-primary);
        animation: pulse 1s ease-in-out infinite;
      }

      /* Visual hierarchy by depth - subtle background darkening for nested levels */
      .tree-node-card[style*="margin-left: 16px"] {
        background: var(--arbor-bg);
        border-left-width: 1.5px;
      }

      .tree-node-card[style*="margin-left: 32px"],
      .tree-node-card[style*="margin-left: 48px"],
      .tree-node-card[style*="margin-left: 64px"] {
        background: rgba(20, 18, 16, 0.3);
        border-left-width: 1px;
        font-size: 12.5px;
      }

      .tree-node-card[style*="margin-left: 32px"] .tree-node-title,
      .tree-node-card[style*="margin-left: 48px"] .tree-node-title,
      .tree-node-card[style*="margin-left: 64px"] .tree-node-title {
        font-size: 12.5px;
      }

      /* Legacy tree-node class support for backwards compatibility */
      .tree-node {
        padding: 10px 12px;
        margin: 4px 0;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: flex-start;
        gap: 10px;
        position: relative;
        min-height: 40px;
      }

      /* Prevent tree node click from interfering with button clicks */
      .tree-node > button,
      .tree-node > .tree-node-icon-btn {
        pointer-events: auto;
        z-index: 10;
        position: relative;
      }

      /* Ensure collapse button has proper click area and doesn't get overlapped */
      .tree-node-collapse-btn {
        position: relative;
        z-index: 15;
        pointer-events: auto !important;
        margin-right: 2px;
      }

      /* Make sure tree node title area doesn't capture collapse button clicks */
      .tree-node > div[style*="flex: 1"] {
        pointer-events: auto;
      }

      /* Ensure collapse button area is clearly separated */
      .tree-node-spacer {
        pointer-events: none;
      }

      .tree-node:hover {
        background: var(--arbor-bg-elevated);
        box-shadow: 0 0 0 1px var(--arbor-border-default);
      }

      .tree-node:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
        background: var(--arbor-bg-elevated);
      }

      /* Visual depth indicators */
      .tree-node[style*="margin-left: 16px"]::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(180deg, var(--arbor-border-subtle) 0%, transparent 100%);
        opacity: 0.5;
      }

      .tree-node[style*="margin-left: 32px"]::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(180deg, var(--arbor-primary-soft) 0%, transparent 100%);
        opacity: 0.7;
      }

      .tree-node.draggable,
      .tree-node-card {
        cursor: grab;
        user-select: none;
      }

      .tree-node.dragging,
      .tree-node-card.dragging {
        cursor: grabbing !important;
        opacity: 0.5;
        background: var(--arbor-bg-elevated);
        box-shadow: var(--arbor-shadow-lg);
        transform: scale(0.95) rotate(2deg);
        border: 2px dashed var(--arbor-primary);
      }
      
      .tree-node[draggable="true"]:active,
      .tree-node-card[draggable="true"]:active {
        cursor: grabbing !important;
      }

      /* Drag over state (drop target) */
      .tree-node.drag-over,
      .tree-node-card.drag-over {
        background: rgba(125, 155, 118, 0.15);
        box-shadow: 0 0 0 2px var(--arbor-primary);
        animation: pulse 1s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 0 0 2px var(--arbor-primary);
        }
        50% {
          box-shadow: 0 0 0 2px var(--arbor-primary), 0 0 8px 2px var(--arbor-primary-soft);
        }
      }

      @keyframes dropSuccess {
        0% {
          background: var(--arbor-primary-soft);
          transform: scale(1);
        }
        50% {
          background: rgba(125, 155, 118, 0.25);
          transform: scale(1.02);
        }
        100% {
          background: transparent;
          transform: scale(1);
        }
      }

      .tree-node-collapse-btn {
        background: transparent;
        border: none;
        padding: 4px;
        width: 24px;
        height: 24px;
        min-width: 24px;
        min-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--arbor-text-tertiary);
        cursor: pointer;
        border-radius: 6px;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
        position: relative;
        z-index: 10;
        pointer-events: auto;
        margin: -2px 0;
      }

      .tree-node-collapse-btn:hover {
        background: var(--arbor-bg-raised);
        color: var(--arbor-text-secondary);
      }

      .tree-node-collapse-btn:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
        background: var(--arbor-bg-raised);
      }

      .tree-node-collapse-btn[aria-expanded="false"] svg {
        transform: rotate(-90deg);
      }

      .tree-node-spacer {
        width: 24px;
        flex-shrink: 0;
      }

      .tree-node-spacer-icon {
        width: 20px;
        flex-shrink: 0;
      }

      .tree-node-spacer-icon {
        width: 20px;
        flex-shrink: 0;
      }

      .tree-node-icon-btn {
        background: transparent;
        border: none;
        padding: 2px 4px;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
        position: relative;
      }

      .tree-node-icon-btn:hover {
        background: var(--arbor-bg-elevated);
      }

      .tree-node-icon {
        font-size: 16px;
        flex-shrink: 0;
        width: 20px;
        text-align: center;
        display: inline-block;
        line-height: 1.4;
      }

      .tree-node-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        margin-bottom: 0;
        line-height: 1.4;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        word-break: break-word;
        max-width: 100%;
      }

      .tree-node-meta {
        font-size: 11px;
        color: var(--arbor-text-tertiary);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 3px;
      }

      .tree-node-branch-badge {
        background: var(--arbor-primary-soft);
        color: var(--arbor-primary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
      }

      .tree-node-children {
        overflow: hidden;
        transition: max-height 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tree-node-children.collapsed {
        max-height: 0 !important;
        opacity: 0;
      }

      /* Buttons */
      .arbor-btn {
        padding: 10px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        position: relative;
      }

      .arbor-btn svg {
        flex-shrink: 0;
      }

      /* Tooltip positioning for action buttons at bottom */
      .arbor-action-buttons [data-tooltip]:hover::before {
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        white-space: normal;
        max-width: 200px;
        text-align: center;
      }

      .arbor-btn-primary {
        background: var(--arbor-primary);
        color: #141210;
      }

      .arbor-btn-primary:hover {
        background: #8ba884;
        transform: translateY(-1px);
        box-shadow: var(--arbor-shadow-sm);
      }

      .arbor-btn-primary:active {
        background: #6e8a68;
        transform: translateY(0);
      }

      .arbor-btn-secondary {
        background: var(--arbor-bg-raised);
        color: var(--arbor-text-primary);
        border: 1px solid var(--arbor-border-default);
      }

      .arbor-btn-secondary:hover {
        background: var(--arbor-bg-elevated);
        border-color: var(--arbor-border-strong);
        transform: translateY(-1px);
      }

      .arbor-btn-secondary:active {
        transform: translateY(0);
      }

      .arbor-btn-ghost {
        background: transparent;
        color: var(--arbor-text-secondary);
        padding: 6px 8px;
        font-size: 12px;
        font-weight: 500;
      }

      .arbor-btn-ghost:hover {
        background: var(--arbor-bg-elevated);
        color: var(--arbor-text-primary);
      }

      .arbor-btn-danger {
        background: transparent;
        color: var(--arbor-error);
        padding: 6px 8px;
        font-size: 12px;
        font-weight: 500;
      }

      .arbor-btn-danger:hover {
        background: rgba(184, 107, 107, 0.1);
      }

      /* Action Buttons Container */
      .arbor-action-buttons {
        padding: 16px 20px;
        border-top: 1px solid var(--arbor-border-subtle);
        background: var(--arbor-bg);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .arbor-action-buttons-row {
        display: flex;
        gap: 10px;
      }

      .arbor-action-buttons-row .arbor-btn {
        flex: 1;
      }

      /* Empty State */
      .arbor-empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--arbor-text-tertiary);
      }

      .arbor-empty-state-icon {
        font-size: 32px;
        margin-bottom: 16px;
        opacity: 0.7;
      }

      .arbor-empty-state-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        margin-top: 16px;
        margin-bottom: 8px;
      }

      .arbor-empty-state-description {
        font-size: 14px;
        color: var(--arbor-text-secondary);
        line-height: 1.5;
      }

      /* API Key Notice */
      .arbor-api-notice {
        margin: 16px 20px;
        padding: 16px;
        background: var(--arbor-accent-soft);
        border: 1px solid rgba(201, 166, 107, 0.25);
        border-radius: 8px;
        color: var(--arbor-warning);
        font-size: 12px;
        line-height: 1.5;
      }

      .arbor-api-notice-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
      }

      .arbor-api-notice-title {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        font-weight: 600;
      }

      .arbor-api-notice-text {
        margin: 0;
        color: rgba(201, 168, 87, 0.9);
      }


      /* Untracked Chats */
      .arbor-untracked-list {
        max-height: 250px;
        overflow-y: auto;
      }

      .arbor-untracked-item {
        background: transparent;
        padding: 12px;
        margin-bottom: 4px;
        border-radius: 6px;
        border: none;
        font-size: 13px;
        color: var(--arbor-text-secondary);
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        min-height: 40px;
      }

      .arbor-untracked-item:hover {
        background: var(--arbor-bg-elevated);
        box-shadow: 0 0 0 1px var(--arbor-border-default);
      }

      .arbor-untracked-item:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
        background: var(--arbor-bg-elevated);
      }

      .arbor-untracked-item-title {
        flex: 1;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: break-word;
        line-height: 1.5;
      }

      .arbor-add-btn {
        color: var(--arbor-primary);
        font-size: 20px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        border-radius: 6px;
        background: var(--arbor-primary-soft);
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
        border: none;
      }

      .arbor-add-btn:hover {
        background: rgba(125, 155, 118, 0.2);
        transform: scale(1.05);
      }

      .arbor-add-btn:active {
        transform: scale(0.95);
      }

      .arbor-add-btn:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
      }

      /* Node Actions Container */
      .tree-node-actions {
        display: flex;
        gap: 4px;
        margin-left: auto;
        flex-shrink: 0;
        align-self: center;
        opacity: 0.3;
        transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 10;
      }

      .tree-node:hover .tree-node-actions,
      .tree-node-card:hover .tree-node-actions {
        opacity: 1;
      }

      .tree-node-actions:focus-within {
        opacity: 1;
      }

      /* Edit and Delete Node Buttons */
      .edit-node-btn,
      .delete-node-btn {
        padding: 5px;
        width: 24px;
        height: 24px;
        min-width: 24px;
        min-height: 24px;
        background: transparent;
        color: var(--arbor-text-tertiary);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
      }

      .delete-node-btn {
        font-size: 16px;
        font-weight: 400;
        line-height: 1;
      }

      .edit-node-btn:hover {
        background: var(--arbor-primary-soft);
        color: var(--arbor-primary);
        z-index: 2;
      }

      .delete-node-btn:hover {
        background: rgba(184, 107, 107, 0.15);
        color: var(--arbor-error);
        z-index: 2;
      }

      .edit-node-btn:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
        z-index: 2;
      }

      .delete-node-btn:focus-visible {
        outline: 2px solid var(--arbor-error);
        outline-offset: 2px;
        z-index: 2;
      }

      .edit-node-btn:active {
        transform: scale(0.92);
      }

      .delete-node-btn:active {
        transform: scale(0.92);
      }

      /* Graph View */
      .arbor-graph-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--arbor-border-subtle);
        background: var(--arbor-bg-raised);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 56px;
        flex-wrap: nowrap;
      }

      .arbor-graph-header-main {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
      }

      .arbor-graph-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        flex-wrap: nowrap;
      }

      .arbor-graph-title {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        white-space: nowrap;
        flex-shrink: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }

      .arbor-zoom-controls {
        display: flex;
        gap: 2px;
        align-items: center;
        background: var(--arbor-bg-elevated);
        border: 1px solid var(--arbor-border-default);
        border-radius: 6px;
        padding: 4px;
        flex-shrink: 0;
        min-width: fit-content;
      }

      .arbor-zoom-btn {
        width: 26px;
        height: 26px;
        padding: 0;
        background: transparent;
        color: var(--arbor-text-secondary);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        flex-shrink: 0;
        position: relative;
      }

      /* Tooltip positioning for zoom buttons */
      .arbor-zoom-controls [data-tooltip]:hover::before {
        bottom: auto;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
      }

      .arbor-zoom-controls [data-tooltip]:hover::after {
        bottom: auto;
        top: calc(100% + 2px);
        left: 50%;
        transform: translateX(-50%) rotate(180deg);
        border-top: none;
        border-bottom: 5px solid var(--arbor-bg-raised);
      }

      .arbor-zoom-btn:hover {
        background: var(--arbor-bg-raised);
        color: var(--arbor-text-primary);
      }

      .arbor-zoom-btn:active {
        transform: scale(0.95);
      }

      .arbor-zoom-reset {
        width: auto;
        min-width: 26px;
        padding: 0 6px;
      }

      .arbor-zoom-reset svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .arbor-zoom-divider {
        width: 1px;
        height: 14px;
        background: var(--arbor-border-default);
        margin: 0 2px;
        flex-shrink: 0;
      }

      .arbor-zoom-level {
        font-size: 11px;
        color: var(--arbor-text-secondary);
        min-width: 38px;
        text-align: center;
        font-weight: 500;
        padding: 0 3px;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }

      .arbor-header-action {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: auto;
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
      }

      .arbor-icon-reset {
        font-size: 14px;
        line-height: 1;
      }

      /* Emoji Picker */
      #arbor-emoji-picker {
        scrollbar-width: thin;
        scrollbar-color: var(--arbor-border-default) var(--arbor-bg);
      }

      #arbor-emoji-picker::-webkit-scrollbar {
        width: 6px;
      }

      #arbor-emoji-picker::-webkit-scrollbar-track {
        background: var(--arbor-bg);
      }

      #arbor-emoji-picker::-webkit-scrollbar-thumb {
        background: var(--arbor-border-default);
        border-radius: 3px;
      }

      #arbor-emoji-picker::-webkit-scrollbar-thumb:hover {
        background: var(--arbor-border-strong);
      }

      /* Style emoji-picker-element to match Arbor theme */
      #arbor-emoji-picker emoji-picker {
        --background: var(--arbor-bg-raised);
        --border-color: var(--arbor-border-subtle);
        --button-hover-background: var(--arbor-bg-elevated);
        --button-active-background: var(--arbor-primary-soft);
        --text-color: var(--arbor-text-primary);
        --secondary-text-color: var(--arbor-text-secondary);
        --input-font-color: var(--arbor-text-primary);
        --input-border-color: var(--arbor-border-default);
        --input-placeholder-color: var(--arbor-text-tertiary);
        --indicator-color: var(--arbor-primary);
        --outline-color: var(--arbor-primary);
      }

      /* Reset Layout Button */
      #reset-layout-btn:hover {
        background: var(--arbor-bg-elevated);
        color: var(--arbor-primary);
      }

      /* Full-page Graph Button */
      #open-fullpage-graph-btn:hover {
        background: var(--arbor-bg-elevated);
        color: var(--arbor-accent);
      }

      /* Responsive: Compact header for narrow sidebars */
      @media (max-width: 400px) {
        .arbor-graph-header {
          padding: 10px 12px;
          gap: 8px;
        }

        .arbor-graph-header-main {
          gap: 8px;
        }

        .arbor-graph-title {
          font-size: 13px;
        }

        .arbor-zoom-controls {
          padding: 2px;
        }

        .arbor-zoom-btn {
          width: 24px;
          height: 24px;
        }

        .arbor-zoom-level {
          min-width: 34px;
          font-size: 10px;
        }

        .arbor-graph-header-actions {
          gap: 4px;
        }

        .arbor-icon-btn {
          width: 30px;
          height: 30px;
        }
      }

      /* Extra compact for very narrow sidebars */
      @media (max-width: 350px) {
        .arbor-graph-title {
          display: none;
        }

        .arbor-graph-header-main {
          gap: 0;
          justify-content: center;
        }
      }

      .arbor-graph-canvas {
        width: 100%;
        height: calc(100% - 65px);
        position: relative;
        overflow: auto;
        background: var(--arbor-bg-deep);
        cursor: default;
      }

      /* Graph Nodes with Visual Hierarchy */
      .graph-node {
        position: absolute;
        background: var(--arbor-bg-raised);
        border: 1px solid var(--arbor-border-subtle);
        border-radius: 10px;
        padding: 12px 14px;
        cursor: grab;
        transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1),
                    background 150ms cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--arbor-shadow-sm);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        user-select: none;
        touch-action: none;
        will-change: transform;
      }

      .graph-node:hover {
        background: var(--arbor-bg-elevated);
        box-shadow: var(--arbor-shadow-md);
        transform: translateY(-2px);
      }

      .graph-node:active {
        cursor: grabbing !important;
      }

      .graph-node.dragging {
        opacity: 0.85;
        box-shadow: var(--arbor-shadow-lg);
        z-index: 1000 !important;
        cursor: grabbing !important;
        transform: scale(1.02);
        transition: opacity 100ms ease, box-shadow 100ms ease, transform 100ms ease;
      }

      .graph-node.active {
        background: var(--arbor-primary-soft);
        border-color: var(--arbor-primary-muted);
        box-shadow: var(--arbor-shadow-md), 0 0 0 2px var(--arbor-primary-soft);
      }

      /* Root node (level 0) with amber accent */
      .graph-node.level-0 {
        border: 2px solid #96794c;
        box-shadow: var(--arbor-shadow-md), 0 0 16px rgba(201, 166, 107, 0.2);
        font-weight: 500;
      }

      .root-accent-dot {
        position: absolute;
        top: 10px;
        left: 10px;
        width: 10px;
        height: 10px;
        background: #c9a66b;
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(201, 166, 107, 0.4);
      }

      .graph-node-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        margin-bottom: 4px;
        line-height: 1.3;
      }

      .graph-node.level-0 .graph-node-title {
        font-size: 14px;
        font-weight: 600;
      }

      .graph-node-platform {
        font-size: 11px;
        color: var(--arbor-text-tertiary);
      }

      /* SVG Connections with Bezier Curves */
      .connection-svg {
        overflow: visible !important;
      }

      .connection-path {
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* Connection Labels */
      .connection-label {
        z-index: 100;
      }

      /* Floating Toggle Buttons — 8px radius, green active state */
      /* Side Toggle Buttons */
      .arbor-side-toggle-btn {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        padding: 12px 16px;
        background: rgba(26, 24, 21, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid var(--arbor-border-default);
        color: var(--arbor-text-primary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: var(--arbor-shadow-md);
        z-index: 1000000;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }
      
      #toggle-sidebar-btn {
        left: 0;
        border-left: none;
        border-radius: 0 8px 8px 0;
      }
      
      #toggle-graph-btn-bottom {
        right: 0;
        border-right: none;
        border-radius: 8px 0 0 8px;
        flex-direction: row-reverse;
      }
      
      .arbor-side-toggle-btn:hover {
        background: rgba(41, 37, 32, 0.98);
        border-color: var(--arbor-border-strong);
      }
      
      .arbor-side-toggle-btn.active {
        background: var(--arbor-primary-soft);
        border-color: var(--arbor-primary-muted);
        color: var(--arbor-primary);
      }
      
      .arbor-side-toggle-btn svg {
        flex-shrink: 0;
      }

      /* Focus States */
      .arbor-btn:focus-visible,
      .arbor-zoom-btn:focus-visible,
      .arbor-icon-btn:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
      }

      /* Active/Pressed States */
      .tree-node:active {
        transform: scale(0.98);
        transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-action-btn:active {
        transform: scale(0.92);
      }

      .arbor-icon-btn:active {
        transform: scale(0.90);
      }

      /* Scrollbar Styling */
      .arbor-content::-webkit-scrollbar,
      .arbor-untracked-list::-webkit-scrollbar,
      .arbor-tree-dropdown-list::-webkit-scrollbar,
      .arbor-graph-canvas::-webkit-scrollbar {
        width: 8px;
      }

      .arbor-content::-webkit-scrollbar-track,
      .arbor-untracked-list::-webkit-scrollbar-track,
      .arbor-tree-dropdown-list::-webkit-scrollbar-track,
      .arbor-graph-canvas::-webkit-scrollbar-track {
        background: var(--arbor-bg);
      }

      .arbor-content::-webkit-scrollbar-thumb,
      .arbor-untracked-list::-webkit-scrollbar-thumb,
      .arbor-tree-dropdown-list::-webkit-scrollbar-thumb,
      .arbor-graph-canvas::-webkit-scrollbar-thumb {
        background: var(--arbor-border-default);
        border-radius: 4px;
      }

      .arbor-content::-webkit-scrollbar-thumb:hover,
      .arbor-untracked-list::-webkit-scrollbar-thumb:hover,
      .arbor-tree-dropdown-list::-webkit-scrollbar-thumb:hover,
      .arbor-graph-canvas::-webkit-scrollbar-thumb:hover {
        background: var(--arbor-border-strong);
      }

      /* Inline Edit Input */
      .arbor-inline-edit-input {
        outline: none;
      }

      .arbor-inline-edit-input:focus {
        border-color: var(--arbor-primary);
        box-shadow: 0 0 0 2px var(--arbor-primary-soft);
      }

      /* Modal/Dialog — warm colors */
      .arbor-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(20, 18, 16, 0.8);
        z-index: 99999999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .arbor-modal {
        background: var(--arbor-bg-raised);
        border: 1px solid var(--arbor-border-default);
        border-radius: 12px;
        padding: 24px;
        max-width: 480px;
        width: 90%;
        max-height: 85vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: var(--arbor-shadow-lg);
      }

      .arbor-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .arbor-modal-title {
        color: var(--arbor-text-primary);
        margin: 0;
        font-size: 17px;
        font-weight: 600;
      }

      .arbor-modal-close {
        background: none;
        border: none;
        color: var(--arbor-text-secondary);
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-modal-close:hover {
        background: var(--arbor-bg-elevated);
      }

      .arbor-modal-section {
        background: var(--arbor-bg);
        border: 1px solid var(--arbor-border-subtle);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
      }

      .arbor-modal-section-label {
        color: var(--arbor-text-secondary);
        font-size: 12px;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .arbor-modal-text {
        color: var(--arbor-text-secondary);
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.5;
      }

      .arbor-modal-scroll {
        flex: 1;
        overflow-y: auto;
        margin: 0 -24px;
        padding: 0 24px;
        max-height: 300px;
      }

      .arbor-connection-option {
        background: var(--arbor-bg);
        border: 1px solid var(--arbor-border-subtle);
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-connection-option:last-child {
        margin-bottom: 0;
      }

      .arbor-connection-option:hover {
        background: var(--arbor-bg-raised);
        border-color: var(--arbor-border-default);
      }

      .arbor-connection-option.selected {
        background: var(--arbor-primary-soft);
        border-color: var(--arbor-primary-muted);
      }

      .arbor-connection-option-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .arbor-connection-option-icon {
        font-size: 18px;
        flex-shrink: 0;
      }

      .arbor-connection-option-text {
        flex: 1;
      }

      .arbor-connection-option-title {
        color: var(--arbor-text-primary);
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 2px;
        text-transform: capitalize;
      }

      .arbor-connection-option-description {
        color: var(--arbor-text-tertiary);
        font-size: 11px;
        line-height: 1.4;
      }

      .arbor-connection-option-check {
        color: var(--arbor-primary);
        font-size: 16px;
        flex-shrink: 0;
      }

      .arbor-modal-custom-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--arbor-border-subtle);
      }

      .arbor-modal-input {
        width: 100%;
        padding: 10px 12px;
        background: var(--arbor-bg);
        border: 1px solid var(--arbor-border-default);
        border-radius: 6px;
        color: var(--arbor-text-primary);
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-modal-input:focus {
        outline: none;
        border-color: var(--arbor-primary);
        box-shadow: 0 0 0 2px var(--arbor-primary-soft);
      }

      .arbor-modal-input.selected {
        border-color: var(--arbor-primary);
        box-shadow: 0 0 0 2px var(--arbor-primary-soft);
      }

      .arbor-modal-actions {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--arbor-border-subtle);
        display: flex;
        gap: 10px;
      }

      .arbor-modal-actions .arbor-btn {
        flex: 1;
      }

      .arbor-connection-preview {
        color: var(--arbor-text-primary);
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 6px;
      }

      .arbor-connection-preview-label {
        color: var(--arbor-text-secondary);
        font-weight: 400;
      }

      .arbor-connection-arrow {
        color: var(--arbor-primary);
        font-size: 16px;
        text-align: center;
        margin: 4px 0;
      }

      /* Confirmation Dialog */
      .arbor-confirmation-dialog {
        background: var(--arbor-bg-raised);
        border: 1px solid var(--arbor-border-default);
        border-radius: 12px;
        padding: 24px;
        max-width: 420px;
        width: 90%;
        box-shadow: var(--arbor-shadow-lg);
        animation: dialogSlideIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes dialogSlideIn {
        from {
          opacity: 0;
          transform: translateY(-16px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .arbor-confirmation-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(184, 107, 107, 0.12);
      }

      .arbor-confirmation-icon svg {
        color: var(--arbor-error);
      }

      .arbor-confirmation-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--arbor-text-primary);
        margin: 0 0 12px;
        text-align: center;
      }

      .arbor-confirmation-message {
        font-size: 14px;
        color: var(--arbor-text-secondary);
        margin: 0 0 24px;
        text-align: center;
        line-height: 1.5;
      }

      .arbor-confirmation-details {
        background: var(--arbor-bg);
        border: 1px solid var(--arbor-border-subtle);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 20px;
      }

      .arbor-confirmation-detail-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--arbor-text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }

      .arbor-confirmation-detail-value {
        font-size: 13px;
        color: var(--arbor-text-primary);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arbor-confirmation-actions {
        display: flex;
        gap: 10px;
      }

      .arbor-confirmation-actions .arbor-btn {
        flex: 1;
      }

      .arbor-btn-destructive {
        background: var(--arbor-error);
        color: #fff;
        border: none;
      }

      .arbor-btn-destructive:hover {
        background: #c97878;
        transform: translateY(-1px);
        box-shadow: var(--arbor-shadow-sm);
      }

      .arbor-btn-destructive:active {
        background: #a65858;
        transform: translateY(0);
      }

      /* Loading States */
      .arbor-btn.loading {
        pointer-events: none;
        opacity: 0.7;
        position: relative;
      }

      .arbor-btn.loading::after {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-left: 8px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Skeleton Loading for tree nodes */
      .tree-node.loading {
        pointer-events: none;
        opacity: 0.6;
      }

      .tree-node.loading .tree-node-title {
        background: linear-gradient(
          90deg,
          var(--arbor-bg-elevated) 25%,
          var(--arbor-bg-raised) 50%,
          var(--arbor-bg-elevated) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
        color: transparent;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Mobile Responsive */
      @media (max-width: 500px) {
        .arbor-zoom-btn {
          min-width: 28px;
          min-height: 28px;
          font-size: 12px;
        }

        .arbor-zoom-level {
          min-width: 40px;
          font-size: 11px;
        }
      }
    `;
  }
}
