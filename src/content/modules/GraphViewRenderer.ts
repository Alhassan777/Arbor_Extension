/**
 * GraphViewRenderer - Handles graph view HTML generation
 */

export class GraphViewRenderer {
  static render(): string {
    return `
      <div style="padding: 16px 20px; border-bottom: 1px solid #2a3530; background: #131917; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #e8efe9; white-space: nowrap;">📊 Tree Visualization</h3>
          <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
            <button id="zoom-out-btn" class="zoom-control-btn" style="
              min-width: 32px;
              min-height: 32px;
              padding: 0;
              background: #1c2420;
              color: #9caba3;
              border: 1px solid #2a3530;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              line-height: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              user-select: none;
            ">−</button>
            <span id="zoom-level" style="
              font-size: 12px;
              color: #9caba3;
              min-width: 50px;
              text-align: center;
              font-weight: 500;
              padding: 0 4px;
            ">100%</span>
            <button id="zoom-in-btn" class="zoom-control-btn" style="
              min-width: 32px;
              min-height: 32px;
              padding: 0;
              background: #1c2420;
              color: #9caba3;
              border: 1px solid #2a3530;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              line-height: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              user-select: none;
            ">+</button>
            <button id="zoom-reset-btn" class="zoom-control-btn" style="
              min-width: 56px;
              min-height: 32px;
              padding: 0 10px;
              background: #1c2420;
              color: #9caba3;
              border: 1px solid #2a3530;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 600;
              line-height: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              user-select: none;
              white-space: nowrap;
            ">Reset</button>
          </div>
        </div>
        <button id="close-graph-btn" style="
          min-width: 70px;
          min-height: 32px;
          padding: 0 14px;
          background: #1c2420;
          color: #9caba3;
          border: 1px solid #2a3530;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          user-select: none;
          white-space: nowrap;
          flex-shrink: 0;
        ">✕ <span>Close</span></button>
      </div>
      <div style="
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(28, 36, 32, 0.9);
        border: 1px solid #2a3530;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 11px;
        color: #6a7570;
        z-index: 100;
        pointer-events: none;
      ">
        💡 <strong>Tip:</strong> Space + Scroll to zoom, Space + Drag to pan
      </div>
      <div id="graph-canvas" style="width: 100%; height: calc(100% - 65px); position: relative; overflow: auto; background: #0f1311; cursor: default;">
        <div id="graph-content" style="position: relative; width: 2000px; height: 2000px;"></div>
      </div>
    `;
  }
}
