export class SidebarObserver {
  private observer: MutationObserver | null = null;

  start(onSidebarRemoved: () => void) {
    this.observer = new MutationObserver(() => {
      const sidebarExists = document.getElementById('arbor-sidebar-container');
      const graphExists = document.getElementById('arbor-graph-container');

      if (!sidebarExists || !graphExists) {
        console.log('🔄 Sidebar removed, triggering re-injection...');
        onSidebarRemoved();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: false,
    });

    console.log('👀 Sidebar observer active');
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
