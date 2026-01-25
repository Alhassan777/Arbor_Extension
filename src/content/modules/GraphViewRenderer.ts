/**
 * GraphViewRenderer - Handles graph view HTML generation
 */

export class GraphViewRenderer {
  static render(): string {
    return `
      <div class="arbor-graph-header">
        <div class="arbor-graph-header-main">
          <h3 class="arbor-graph-title">Tree visualization</h3>
          <div class="arbor-zoom-controls">
            <button id="zoom-out-btn" class="arbor-zoom-btn" aria-label="Zoom out" title="Zoom out">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <span id="zoom-level" class="arbor-zoom-level">100%</span>
            <button id="zoom-in-btn" class="arbor-zoom-btn" aria-label="Zoom in" title="Zoom in">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="arbor-zoom-divider"></div>
            <button id="zoom-reset-btn" class="arbor-zoom-btn arbor-zoom-reset" aria-label="Reset zoom" title="Reset zoom">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 3v4h-4M3 13v-4h4M13.5 7A6.5 6.5 0 0 0 3.5 4.5M2.5 9a6.5 6.5 0 0 0 10 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="arbor-graph-header-actions">
          <button id="reset-layout-btn" class="arbor-icon-btn" aria-label="Reset graph layout" title="Reset layout">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 7V3h4M16 7V3h-4M2 11v4h4M16 11v4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button id="close-graph-btn" class="arbor-icon-btn" aria-label="Close tree visualization" title="Close">
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
