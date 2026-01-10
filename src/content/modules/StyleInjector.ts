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
      /* Sidebar and graph panels overlay on top of content */
      #arbor-sidebar-container,
      #arbor-graph-container {
        position: fixed;
        top: 0;
        height: 100vh;
        background: #1a1a1a;
        color: #e0e0e0;
        z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.3s ease;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
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

      #arbor-sidebar-container {
        left: 0;
        width: 320px;
        border-right: 1px solid #2a3530;
        transform: translateX(0);
        box-shadow: 2px 0 16px rgba(0, 0, 0, 0.5);
      }
      
      #arbor-sidebar-container.hidden {
        transform: translateX(-100%);
      }

      #arbor-graph-container {
        right: 0;
        width: 400px;
        background: #0f1311;
        transform: translateX(0);
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
      }
      
      #arbor-graph-container.hidden {
        transform: translateX(100%);
      }
      
      /* Floating toggle buttons (Loom-style) */
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
        background: rgba(26, 26, 26, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(42, 53, 48, 0.8);
        border-radius: 24px;
        color: #e8efe9;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      #arbor-toggle-buttons button:hover {
        background: rgba(28, 36, 32, 0.98);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
      
      #arbor-toggle-buttons button:active {
        transform: translateY(0);
      }
      
      #arbor-toggle-buttons button.active {
        background: rgba(45, 212, 167, 0.2);
        border-color: rgba(45, 212, 167, 0.4);
        color: #2dd4a7;
      }

      .connection-line {
        position: absolute;
        height: 2px;
        background: rgba(74, 156, 255, 0.4);
        transform-origin: left center;
        pointer-events: auto;
        transition: all 0.2s ease;
      }

      .graph-node {
        position: absolute;
        background: #252525;
        border: 2px solid #4a9eff;
        border-radius: 12px;
        padding: 12px;
        min-width: 120px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .graph-node:hover {
        background: #2a2a2a;
        box-shadow: 0 4px 12px rgba(74, 156, 255, 0.3);
      }

      .graph-node.active {
        background: linear-gradient(135deg, #2a4a5e 0%, #1e3a4a 100%);
        box-shadow: 0 0 20px rgba(45, 212, 167, 0.3);
      }

      .graph-node-title {
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 4px;
      }

      .graph-node-platform {
        font-size: 10px;
        color: #999;
      }

      /* Sidebar tree node delete button */
      .tree-node:hover .delete-node-btn {
        opacity: 1 !important;
      }

      .delete-node-btn:hover {
        background: rgba(239, 68, 68, 0.2) !important;
        border-color: rgba(239, 68, 68, 0.5) !important;
        transform: scale(1.1);
      }

      .delete-node-btn:active {
        transform: scale(0.95);
      }

      /* Graph visualization header buttons */
      .zoom-control-btn {
        position: relative;
      }

      .zoom-control-btn:hover {
        background: #252a28 !important;
        color: #e8efe9 !important;
        border-color: #3a4540 !important;
        transform: translateY(-1px);
      }

      .zoom-control-btn:active {
        transform: translateY(0);
        background: #1a1f1d !important;
      }

      #close-graph-btn:hover {
        background: #252a28 !important;
        color: #e8efe9 !important;
        border-color: #3a4540 !important;
        transform: translateY(-1px);
      }

      #close-graph-btn:active {
        transform: translateY(0);
        background: #1a1f1d !important;
      }

      /* Ensure buttons maintain size on mobile/small screens */
      @media (max-width: 500px) {
        #arbor-graph-container .zoom-control-btn,
        #arbor-graph-container #close-graph-btn {
          min-width: 28px;
          min-height: 28px;
          font-size: 12px;
        }

        #arbor-graph-container #zoom-level {
          min-width: 40px;
          font-size: 11px;
        }

        #arbor-graph-container #close-graph-btn span {
          display: none;
        }
      }
    `;
  }
}
