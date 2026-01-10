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
    let toggleButtons = document.getElementById("arbor-toggle-buttons");

    if (!toggleButtons) {
      toggleButtons = document.createElement("div");
      toggleButtons.id = "arbor-toggle-buttons";
      toggleButtons.innerHTML = `
        <button id="toggle-sidebar-btn" class="active">
          <span>🌳</span>
          <span>Sidebar</span>
        </button>
        <button id="toggle-graph-btn-bottom">
          <span>📊</span>
          <span>Graph</span>
        </button>
      `;
      document.body.appendChild(toggleButtons);

      // Attach listeners
      document
        .getElementById("toggle-sidebar-btn")
        ?.addEventListener("click", () => {
          this.onToggleSidebar();
        });

      document
        .getElementById("toggle-graph-btn-bottom")
        ?.addEventListener("click", () => {
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
