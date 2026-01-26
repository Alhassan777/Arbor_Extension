/**
 * GraphViewRenderer - Handles graph view HTML generation
 */

export class GraphViewRenderer {
  static render(): string {
    return `
      <div class="arbor-graph-header">
        <div class="arbor-graph-header-main">
          <div class="arbor-zoom-controls">
            <button id="zoom-out-btn" class="arbor-zoom-btn" aria-label="Zoom out" data-tooltip="Zoom out - Decrease the zoom level to see more of the tree">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <span id="zoom-level" class="arbor-zoom-level">100%</span>
            <button id="zoom-in-btn" class="arbor-zoom-btn" aria-label="Zoom in" data-tooltip="Zoom in - Increase the zoom level to see details">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="arbor-zoom-divider"></div>
            <button id="zoom-reset-btn" class="arbor-zoom-btn arbor-zoom-reset" aria-label="Reset zoom to 100%" data-tooltip="Reset zoom - Return to 100% zoom level (1:1 scale)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="arbor-graph-header-actions">
          <button id="reset-layout-btn" class="arbor-icon-btn" aria-label="Reset graph layout" data-tooltip="Reset layout - Reorganize all nodes to their default positions" style="display: none;">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <!-- Grid dots -->
              <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="9" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="13" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="5" cy="9" r="1.5" fill="currentColor"/>
              <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
              <circle cx="13" cy="9" r="1.5" fill="currentColor"/>
              <circle cx="5" cy="13" r="1.5" fill="currentColor"/>
              <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
              <circle cx="13" cy="13" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          <button id="open-fullpage-graph-btn" class="arbor-icon-btn" aria-label="Open in full page" data-tooltip="Open in new window - Open the graph visualization in a separate full-page window">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="3" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M1 1l3 3M17 1l-3 3M1 17l3-3M17 17l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button id="close-graph-btn" class="arbor-icon-btn" aria-label="Close tree visualization" data-tooltip="Close - Hide the tree visualization panel">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="graph-canvas" class="arbor-graph-canvas">
        <div id="graph-content" style="position: relative; width: 2000px; height: 2000px;"></div>
      </div>
    `;
  }
}
