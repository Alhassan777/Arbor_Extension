/**
 * ToggleButtonsManager - Handles floating toggle buttons
 */

export class ToggleButtonsManager {
  private onToggleSidebar: () => void;
  private onToggleGraph: () => void;

  constructor(
    onToggleSidebar: () => void,
    onToggleGraph: () => void
  ) {
    this.onToggleSidebar = onToggleSidebar;
    this.onToggleGraph = onToggleGraph;
  }

  inject() {
    // Inject sidebar button on the left
    let sidebarBtn = document.getElementById("toggle-sidebar-btn");
    if (!sidebarBtn) {
      sidebarBtn = document.createElement("button");
      sidebarBtn.id = "toggle-sidebar-btn";
      sidebarBtn.className = "arbor-side-toggle-btn active";
      sidebarBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M6 2v12" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>Sidebar</span>
      `;
      document.body.appendChild(sidebarBtn);

      sidebarBtn.addEventListener("click", () => {
        this.onToggleSidebar();
      });
    }

    // Inject graph button on the right
    let graphBtn = document.getElementById("toggle-graph-btn-bottom");
    if (!graphBtn) {
      graphBtn = document.createElement("button");
      graphBtn.id = "toggle-graph-btn-bottom";
      graphBtn.className = "arbor-side-toggle-btn";
      graphBtn.innerHTML = `
        <span>Graph</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="1.5" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="4" cy="10" r="1.5" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="12" cy="10" r="1.5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M7 4.5L5 8.5M9 4.5L11 8.5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      `;
      document.body.appendChild(graphBtn);

      graphBtn.addEventListener("click", () => {
        this.onToggleGraph();
      });
    }
  }

  updateSidebarState(isVisible: boolean) {
    const btn = document.getElementById("toggle-sidebar-btn");
    if (btn) {
      if (isVisible) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  }

  updateGraphState(isVisible: boolean) {
    const btn = document.getElementById("toggle-graph-btn-bottom");
    if (btn) {
      if (isVisible) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  }
}
