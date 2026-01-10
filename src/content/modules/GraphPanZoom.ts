/**
 * GraphPanZoom - Handles panning and zooming for the graph canvas
 *
 * Features:
 * - Zoom with Space + scroll wheel
 * - Pan with Space + drag
 * - Respects node dragging (doesn't interfere)
 */

export class GraphPanZoom {
  private scale: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private isPanning: boolean = false;
  private isSpacePressed: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private startPanX: number = 0;
  private startPanY: number = 0;
  private canvas: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private mousedownHandler: ((e: MouseEvent) => void) | null = null;
  private mousemoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseupHandler: (() => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;
  private mouseenterHandler: ((e: MouseEvent) => void) | null = null;
  private mouseleaveHandler: ((e: MouseEvent) => void) | null = null;
  private isMouseOverCanvas: boolean = false;
  private initialized: boolean = false;
  private onScaleChange: (() => void) | null = null;

  /**
   * Initialize pan and zoom for the graph canvas
   */
  init(canvasId: string = "graph-canvas", contentId: string = "graph-content") {
    // Clean up existing listeners if reinitializing
    this.destroy();

    const canvas = document.getElementById(canvasId);
    const content = document.getElementById(contentId);

    if (!canvas || !content) {
      console.warn("GraphPanZoom: Canvas or content element not found");
      return;
    }

    this.canvas = canvas as HTMLElement;
    this.content = content as HTMLElement;

    // Make canvas focusable for keyboard events
    this.canvas.setAttribute("tabindex", "0");
    this.canvas.style.outline = "none";

    this.setupMouseTracking();
    this.setupSpaceKey();
    this.setupZoom();
    this.setupPan();
    this.applyTransform(); // Initialize transform
    this.initialized = true;
  }

  /**
   * Set a callback to be called when scale changes
   */
  setOnScaleChange(callback: () => void) {
    this.onScaleChange = callback;
  }

  /**
   * Setup mouse tracking to detect when mouse is over canvas
   */
  private setupMouseTracking() {
    if (!this.canvas) return;

    this.mouseenterHandler = () => {
      this.isMouseOverCanvas = true;
    };

    this.mouseleaveHandler = () => {
      this.isMouseOverCanvas = false;
      // Reset Space state when mouse leaves canvas (unless panning)
      if (this.isSpacePressed && !this.isPanning) {
        this.isSpacePressed = false;
        if (this.canvas) {
          this.canvas.style.cursor = "default";
        }
      }
    };

    this.canvas.addEventListener("mouseenter", this.mouseenterHandler);
    this.canvas.addEventListener("mouseleave", this.mouseleaveHandler);
  }

  /**
   * Setup Space key detection
   */
  private setupSpaceKey() {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        // Handle Space when mouse is over canvas or canvas is focused
        if (this.isMouseOverCanvas || document.activeElement === this.canvas) {
          e.preventDefault();
          e.stopPropagation();
          this.isSpacePressed = true;
          if (this.canvas) {
            this.canvas.style.cursor = "grab";
          }
        }
      }
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        if (this.isSpacePressed) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.isSpacePressed = false;
        if (this.canvas && !this.isPanning) {
          this.canvas.style.cursor = "default";
        }
      }
    };

    document.addEventListener("keydown", this.keydownHandler, true);
    document.addEventListener("keyup", this.keyupHandler, true);
  }

  /**
   * Setup zoom functionality (Space + scroll wheel)
   */
  private setupZoom() {
    if (!this.canvas || !this.content) return;

    this.wheelHandler = (e: WheelEvent) => {
      // Only zoom when Space is held
      if (!this.isSpacePressed) return;

      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.scale = Math.min(2.5, Math.max(0.5, this.scale + delta));

      this.applyScale();
    };

    this.canvas.addEventListener("wheel", this.wheelHandler, {
      passive: false,
    });
  }

  /**
   * Setup pan functionality (Space + drag)
   */
  private setupPan() {
    if (!this.canvas) return;

    this.mousedownHandler = (e: MouseEvent) => {
      if (!this.canvas) return;

      const target = e.target as HTMLElement;

      // Don't pan if clicking on interactive elements
      const isOnInteractive =
        target.closest(".graph-node") ||
        target.closest(".connection-line") ||
        target.closest(".connection-label") ||
        target.closest(".connection-add-label");

      if (isOnInteractive) {
        // Focus canvas for keyboard events even when clicking on nodes
        this.canvas.focus();
        return;
      }

      // Focus canvas on background click to enable keyboard events
      this.canvas.focus();

      // Only pan when Space is held
      if (!this.isSpacePressed) {
        return;
      }

      // Only pan with left mouse button
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      this.isPanning = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startPanX = this.panX;
      this.startPanY = this.panY;
      this.canvas.style.cursor = "grabbing";

      // Ensure canvas can receive mouse events
      this.canvas.style.userSelect = "none";
    };

    this.mousemoveHandler = (e: MouseEvent) => {
      if (!this.isPanning || !this.canvas) return;

      e.preventDefault();
      e.stopPropagation();

      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;

      this.panX = this.startPanX + dx;
      this.panY = this.startPanY + dy;

      this.applyTransform();
    };

    this.mouseupHandler = () => {
      if (!this.isPanning) return;

      this.isPanning = false;
      if (this.canvas) {
        this.canvas.style.cursor = this.isSpacePressed ? "grab" : "default";
        this.canvas.style.userSelect = "";
      }
    };

    this.canvas.addEventListener("mousedown", this.mousedownHandler);
    document.addEventListener("mousemove", this.mousemoveHandler);
    document.addEventListener("mouseup", this.mouseupHandler);
  }

  /**
   * Apply the current scale and pan to the content element
   */
  applyScale() {
    this.applyTransform();
  }

  /**
   * Apply both scale and pan transforms to the content element
   */
  private applyTransform() {
    if (!this.content) return;

    this.content.style.transformOrigin = "0 0";
    this.content.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    this.content.dataset.scale = String(this.scale);

    // Call the callback if set
    if (this.onScaleChange) {
      this.onScaleChange();
    }
  }

  /**
   * Reset zoom to default (1x) and pan to (0, 0)
   */
  resetZoom() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
  }

  /**
   * Get current zoom scale
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * Set zoom scale programmatically
   */
  setScale(scale: number) {
    this.scale = Math.min(2.5, Math.max(0.5, scale));
    this.applyScale();
  }

  /**
   * Cleanup event listeners (call when graph is removed)
   */
  destroy() {
    if (this.canvas && this.wheelHandler) {
      this.canvas.removeEventListener("wheel", this.wheelHandler);
    }

    if (this.canvas && this.mousedownHandler) {
      this.canvas.removeEventListener("mousedown", this.mousedownHandler);
    }

    if (this.mousemoveHandler) {
      document.removeEventListener("mousemove", this.mousemoveHandler);
    }

    if (this.mouseupHandler) {
      document.removeEventListener("mouseup", this.mouseupHandler);
    }

    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
    }

    if (this.keyupHandler) {
      document.removeEventListener("keyup", this.keyupHandler);
    }

    if (this.canvas && this.mouseenterHandler) {
      this.canvas.removeEventListener("mouseenter", this.mouseenterHandler);
    }

    if (this.canvas && this.mouseleaveHandler) {
      this.canvas.removeEventListener("mouseleave", this.mouseleaveHandler);
    }

    this.canvas = null;
    this.content = null;
    this.isPanning = false;
    this.isSpacePressed = false;
    this.isMouseOverCanvas = false;
    this.panX = 0;
    this.panY = 0;
    this.wheelHandler = null;
    this.mousedownHandler = null;
    this.mousemoveHandler = null;
    this.mouseupHandler = null;
    this.keydownHandler = null;
    this.keyupHandler = null;
    this.mouseenterHandler = null;
    this.mouseleaveHandler = null;
    this.initialized = false;
  }

  /**
   * Check if pan/zoom is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
