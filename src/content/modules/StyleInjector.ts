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
        
        /* Text — warm tones */
        --arbor-text-primary: #ebe6df;
        --arbor-text-secondary: #a39b8f;
        --arbor-text-tertiary: #726b60;
        
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
        font-size: 17px;
        font-weight: 600;
        color: var(--arbor-text-primary);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .arbor-header .arbor-logo {
        width: 32px;
        height: 32px;
        object-fit: contain;
        flex-shrink: 0;
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
      }

      /* Tree Dropdown Selector */
      .arbor-tree-dropdown {
        position: relative;
        margin-bottom: 4px;
      }

      .arbor-tree-dropdown-trigger {
        width: 100%;
        background: var(--arbor-bg-raised);
        border: 1px solid var(--arbor-border-default);
        border-radius: 8px;
        padding: 12px 14px;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        text-align: left;
      }

      .arbor-tree-dropdown-trigger:hover {
        background: var(--arbor-bg-elevated);
        border-color: var(--arbor-border-strong);
      }

      .arbor-tree-dropdown-content {
        flex: 1;
        min-width: 0;
      }

      .arbor-tree-dropdown-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arbor-tree-dropdown-meta {
        font-size: 12px;
        color: var(--arbor-text-tertiary);
      }

      .arbor-tree-dropdown-chevron {
        flex-shrink: 0;
        color: var(--arbor-text-tertiary);
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-tree-dropdown-trigger[aria-expanded="true"] .arbor-tree-dropdown-chevron {
        transform: rotate(180deg);
      }

      .arbor-tree-dropdown-menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--arbor-bg-raised);
        border: 1px solid var(--arbor-border-default);
        border-radius: 8px;
        box-shadow: var(--arbor-shadow-lg);
        z-index: 1000;
        overflow: hidden;
        animation: dropdownSlideIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
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
        padding: 10px 12px;
        cursor: pointer;
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .arbor-tree-dropdown-item:hover {
        background: var(--arbor-bg-elevated);
      }

      .arbor-tree-dropdown-item.active {
        background: var(--arbor-primary-soft);
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
      }

      .arbor-collapsible-header:hover .arbor-collapsible-actions {
        opacity: 1;
      }

      .arbor-action-btn {
        background: transparent;
        border: none;
        padding: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--arbor-text-secondary);
        cursor: pointer;
        border-radius: 4px;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-action-btn:hover {
        background: var(--arbor-bg-elevated);
        color: var(--arbor-text-primary);
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

      /* Tree Nodes — icon-based with progressive indentation */
      .tree-node {
        padding: 8px 12px;
        margin: 2px 0;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
      }

      .tree-node:hover {
        background: var(--arbor-bg-elevated);
      }

      .tree-node.draggable {
        cursor: grab;
        user-select: none;
      }

      .tree-node.dragging {
        cursor: grabbing !important;
        opacity: 0.6;
        background: var(--arbor-bg-elevated);
        box-shadow: var(--arbor-shadow-md);
        transform: scale(0.98);
      }
      
      .tree-node[draggable="true"]:active {
        cursor: grabbing !important;
      }

      .tree-node-collapse-btn {
        background: transparent;
        border: none;
        padding: 0;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--arbor-text-tertiary);
        cursor: pointer;
        border-radius: 4px;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
      }

      .tree-node-collapse-btn:hover {
        background: var(--arbor-bg-raised);
        color: var(--arbor-text-secondary);
      }

      .tree-node-collapse-btn[aria-expanded="false"] svg {
        transform: rotate(-90deg);
      }

      .tree-node-spacer {
        width: 18px;
        flex-shrink: 0;
      }

      .tree-node-icon {
        font-size: 12px;
        color: var(--arbor-text-tertiary);
        flex-shrink: 0;
        width: 16px;
        text-align: center;
      }

      .tree-node-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        margin-bottom: 2px;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tree-node-meta {
        font-size: 11px;
        color: var(--arbor-text-tertiary);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
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
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .arbor-btn-primary {
        background: var(--arbor-primary);
        color: #141210;
      }

      .arbor-btn-primary:hover {
        background: #8ba884;
      }

      .arbor-btn-primary:active {
        background: #6e8a68;
      }

      .arbor-btn-secondary {
        background: var(--arbor-bg-raised);
        color: var(--arbor-text-primary);
        border: 1px solid var(--arbor-border-default);
      }

      .arbor-btn-secondary:hover {
        background: var(--arbor-bg-elevated);
        border-color: var(--arbor-border-strong);
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
        padding: 10px 12px;
        margin-bottom: 4px;
        border-radius: 6px;
        border: none;
        font-size: 12px;
        color: var(--arbor-text-secondary);
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .arbor-untracked-item:hover {
        background: var(--arbor-bg-elevated);
      }

      .arbor-untracked-item-title {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arbor-add-btn {
        color: var(--arbor-primary);
        font-size: 18px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: var(--arbor-primary-soft);
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arbor-add-btn:hover {
        background: rgba(125, 155, 118, 0.2);
      }

      /* Delete Node Button */
      .delete-node-btn {
        padding: 4px;
        width: 20px;
        height: 20px;
        background: transparent;
        color: var(--arbor-text-tertiary);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 400;
        line-height: 1;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
      }

      .tree-node:hover .delete-node-btn {
        opacity: 1;
      }

      .delete-node-btn:hover {
        background: rgba(184, 107, 107, 0.15);
        color: var(--arbor-error);
      }

      /* Graph View */
      .arbor-graph-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--arbor-border-subtle);
        background: var(--arbor-bg-raised);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        min-height: 56px;
      }

      .arbor-graph-header-main {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        min-width: 0;
      }

      .arbor-graph-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin-left: auto;
      }

      .arbor-graph-title {
        margin: 0;
        font-size: 15px;
        font-weight: 500;
        color: var(--arbor-text-primary);
        white-space: nowrap;
        flex-shrink: 0;
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
      }

      .arbor-zoom-btn {
        width: 28px;
        height: 28px;
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
        min-width: 28px;
        padding: 0 6px;
      }

      .arbor-zoom-divider {
        width: 1px;
        height: 16px;
        background: var(--arbor-border-default);
        margin: 0 2px;
      }

      .arbor-zoom-level {
        font-size: 12px;
        color: var(--arbor-text-secondary);
        min-width: 42px;
        text-align: center;
        font-weight: 500;
        padding: 0 4px;
        font-variant-numeric: tabular-nums;
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

      /* Reset Layout Button */
      #reset-layout-btn:hover {
        background: var(--arbor-bg-elevated);
        color: var(--arbor-primary);
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
      #arbor-toggle-buttons {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 1000000;
        pointer-events: none;
      }
      
      #arbor-toggle-buttons button {
        pointer-events: auto;
        padding: 12px 20px;
        background: rgba(26, 24, 21, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid var(--arbor-border-default);
        border-radius: 8px;
        color: var(--arbor-text-primary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: var(--arbor-shadow-md);
      }
      
      #arbor-toggle-buttons button:hover {
        background: rgba(41, 37, 32, 0.98);
        border-color: var(--arbor-border-strong);
      }
      
      #arbor-toggle-buttons button.active {
        background: var(--arbor-primary-soft);
        border-color: var(--arbor-primary-muted);
        color: var(--arbor-primary);
      }

      /* Focus States */
      .arbor-btn:focus-visible,
      .arbor-zoom-btn:focus-visible {
        outline: 2px solid var(--arbor-primary);
        outline-offset: 2px;
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
