/**
 * GraphViewRenderer - Handles graph view HTML generation
 */

export class GraphViewRenderer {
  static render(): string {
    return `
      <div class="arbor-graph-header">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <h3 class="arbor-graph-title">Tree visualization</h3>
          <div class="arbor-zoom-controls">
            <button id="zoom-out-btn" class="arbor-zoom-btn">−</button>
            <span id="zoom-level" class="arbor-zoom-level">100%</span>
            <button id="zoom-in-btn" class="arbor-zoom-btn">+</button>
            <button id="zoom-reset-btn" class="arbor-zoom-btn" style="min-width: 56px; padding: 0 10px; font-size: 11px;">Reset</button>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="reset-layout-btn" class="arbor-btn arbor-btn-secondary" style="min-width: auto; padding: 0 14px; font-size: 12px; display: none; align-items: center; gap: 4px;">
            <span style="font-size: 14px;">↻</span> Reset Layout
          </button>
          <button id="close-graph-btn" class="arbor-btn arbor-btn-secondary" style="min-width: 70px; padding: 0 14px; font-size: 12px;">
            Close
          </button>
        </div>
      </div>
      <div id="graph-canvas" class="arbor-graph-canvas">
        <div id="graph-content" style="position: relative; width: 2000px; height: 2000px;"></div>
      </div>
    `;
  }
}
