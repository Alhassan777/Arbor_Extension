export class SidebarObserver {
  private observer: MutationObserver | null = null;
  private debounceTimer: number | null = null;
  private idleCallbackId: number | null = null;
  private isVisible: boolean = true;

  start(onSidebarRemoved: () => void) {
    // Debounced check function (runs max once every 300ms)
    const debouncedCheck = () => {
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = window.setTimeout(() => {
        this.debounceTimer = null;

        // Only check if sidebar is visible (no point checking if hidden)
        if (!this.isVisible) return;

        // Use requestIdleCallback for non-urgent checks
        if ("requestIdleCallback" in window) {
          this.idleCallbackId = requestIdleCallback(
            () => {
              this.checkSidebarExists(onSidebarRemoved);
              this.idleCallbackId = null;
            },
            { timeout: 1000 },
          );
        } else {
          // Fallback for browsers without requestIdleCallback
          this.checkSidebarExists(onSidebarRemoved);
        }
      }, 300);
    };

    this.observer = new MutationObserver(debouncedCheck);

    // Only observe direct children of body (subtree: false is more efficient)
    this.observer.observe(document.body, {
      childList: true,
      subtree: false,
    });

    // Track visibility to pause checks when tab is hidden
    this.setupVisibilityListener();
  }

  private checkSidebarExists(onSidebarRemoved: () => void) {
    const sidebarExists = document.getElementById("arbor-sidebar-container");
    const graphExists = document.getElementById("arbor-graph-container");

    if (!sidebarExists || !graphExists) {
      onSidebarRemoved();
    }
  }

  private setupVisibilityListener() {
    const handleVisibilityChange = () => {
      this.isVisible = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange();
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }
  }
}
