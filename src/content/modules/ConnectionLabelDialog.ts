/**
 * ConnectionLabelDialog - Custom dialog for editing connection labels
 * Replaces the browser's native prompt() with a modern, user-friendly interface
 */

import type { ConnectionType } from "../../types";

export interface ConnectionTypeOption {
  type: ConnectionType;
  description: string;
  emoji: string;
}

const CONNECTION_TYPES: ConnectionTypeOption[] = [
  {
    type: "extends",
    description: "Extends to related areas",
    emoji: "🔗",
  },
  {
    type: "deepens",
    description: "Explores topic in more depth",
    emoji: "🔍",
  },
  {
    type: "explores",
    description: "Explores a related aspect",
    emoji: "🧭",
  },
  {
    type: "examples",
    description: "Looks at specific examples",
    emoji: "💡",
  },
  {
    type: "applies",
    description: "Applies in practice",
    emoji: "⚙️",
  },
  {
    type: "questions",
    description: "Asks questions about this",
    emoji: "❓",
  },
  {
    type: "contrasts",
    description: "Considers alternative perspective",
    emoji: "🔄",
  },
  {
    type: "summarizes",
    description: "Summarizes and consolidates",
    emoji: "📋",
  },
];

export interface ConnectionLabelDialogOptions {
  parentTitle: string;
  childTitle: string;
  currentLabel?: ConnectionType | null;
  allowCustom?: boolean;
}

export class ConnectionLabelDialog {
  /**
   * Show dialog and return selected connection type
   * Returns the connection type if user selects one, or null if cancelled
   */
  static show(
    options: ConnectionLabelDialogOptions
  ): Promise<ConnectionType | null> {
    return new Promise((resolve) => {
      const { parentTitle, childTitle, currentLabel, allowCustom = true } = options;

      // Remove existing dialog if any
      document.getElementById("arbor-connection-label-dialog")?.remove();

      const modal = document.createElement("div");
      modal.id = "arbor-connection-label-dialog";

      const selectedType: { value: ConnectionType | string } = {
        value: currentLabel || "extends",
      };
      const isCustom = currentLabel && !CONNECTION_TYPES.find(t => t.type === currentLabel);
      
      // Escape HTML for safe rendering
      const escapedParentTitle = ConnectionLabelDialog.escapeHtml(parentTitle);
      const escapedChildTitle = ConnectionLabelDialog.escapeHtml(childTitle);
      const escapedCurrentLabel = isCustom ? ConnectionLabelDialog.escapeHtml(currentLabel || "") : "";

      modal.innerHTML = `
        <div class="arbor-modal-backdrop">
          <div class="arbor-modal">
            <div class="arbor-modal-header">
              <h2 class="arbor-modal-title">Label Connection</h2>
              <button id="close-connection-label-dialog" class="arbor-modal-close">×</button>
            </div>

            <div class="arbor-modal-section">
              <div class="arbor-modal-section-label">Connection</div>
              <div class="arbor-connection-preview">
                From: <span class="arbor-connection-preview-label">${escapedParentTitle}</span>
              </div>
              <div class="arbor-connection-arrow">↓</div>
              <div class="arbor-connection-preview">
                To: <span class="arbor-connection-preview-label">${escapedChildTitle}</span>
              </div>
            </div>

            <p class="arbor-modal-text">
              How does this connection relate?
            </p>

            <div class="arbor-modal-scroll">
              ${CONNECTION_TYPES.map(
                (option) => {
                  const isSelected = !isCustom && option.type === (currentLabel || "extends");
                  return `
                    <div class="arbor-connection-option ${isSelected ? "selected" : ""}" data-type="${option.type}">
                      <div class="arbor-connection-option-content">
                        <span class="arbor-connection-option-icon">${option.emoji}</span>
                        <div class="arbor-connection-option-text">
                          <div class="arbor-connection-option-title">${option.type}</div>
                          <div class="arbor-connection-option-description">${option.description}</div>
                        </div>
                        ${isSelected ? '<span class="arbor-connection-option-check">✓</span>' : ""}
                      </div>
                    </div>
                  `;
                }
              ).join("")}
              ${
                allowCustom
                  ? `
                <div class="arbor-modal-custom-section">
                  <div class="arbor-modal-section-label">Custom label</div>
                  <input 
                    type="text" 
                    id="custom-label-input" 
                    class="arbor-modal-input ${isCustom ? "selected" : ""}"
                    placeholder="Enter custom label..."
                    value="${escapedCurrentLabel}"
                  />
                </div>
              `
                  : ""
              }
            </div>

            <div class="arbor-modal-actions">
              <button id="cancel-connection-label-dialog" class="arbor-btn arbor-btn-secondary">
                Cancel
              </button>
              <button id="confirm-connection-label-dialog" class="arbor-btn arbor-btn-primary">
                Save Label
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const customInput = modal.querySelector("#custom-label-input") as HTMLInputElement;

      // Handle option selection
      modal.querySelectorAll(".arbor-connection-option").forEach((option) => {
        option.addEventListener("click", () => {
          const type = (option as HTMLElement).dataset.type as ConnectionType;
          selectedType.value = type;

          // Clear custom input
          if (customInput) {
            customInput.value = "";
            customInput.classList.remove("selected");
          }

          // Update visual selection
          modal.querySelectorAll(".arbor-connection-option").forEach((opt) => {
            const optEl = opt as HTMLElement;
            const optType = optEl.dataset.type as ConnectionType;
            if (optType === type) {
              optEl.classList.add("selected");
              // Add checkmark if not present
              if (!optEl.querySelector(".arbor-connection-option-check")) {
                const checkmark = document.createElement("span");
                checkmark.className = "arbor-connection-option-check";
                checkmark.textContent = "✓";
                optEl.querySelector(".arbor-connection-option-content")?.appendChild(checkmark);
              }
            } else {
              optEl.classList.remove("selected");
              optEl.querySelector(".arbor-connection-option-check")?.remove();
            }
          });
        });
      });

      // Handle custom input
      if (customInput) {
        customInput.addEventListener("input", () => {
          const value = customInput.value.trim();
          if (value) {
            selectedType.value = value;
            // Clear selection from options
            modal.querySelectorAll(".arbor-connection-option").forEach((opt) => {
              opt.classList.remove("selected");
              opt.querySelector(".arbor-connection-option-check")?.remove();
            });
            customInput.classList.add("selected");
          } else {
            customInput.classList.remove("selected");
          }
        });

        customInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const value = customInput.value.trim();
            if (value) {
              modal.remove();
              resolve(value as ConnectionType);
            }
          }
        });

        if (isCustom) {
          customInput.focus();
          customInput.select();
        }
      }

      // Handle confirm button
      modal.querySelector("#confirm-connection-label-dialog")?.addEventListener("click", () => {
        const finalValue = typeof selectedType.value === 'string' 
          ? (customInput && customInput.value.trim() 
              ? customInput.value.trim() 
              : selectedType.value)
          : selectedType.value;
        
        if (finalValue) {
          modal.remove();
          resolve(finalValue as ConnectionType);
        }
      });

      // Handle cancel button and close button
      const closeDialog = () => {
        modal.remove();
        resolve(null);
      };

      modal.querySelector("#cancel-connection-label-dialog")?.addEventListener("click", closeDialog);
      modal.querySelector("#close-connection-label-dialog")?.addEventListener("click", closeDialog);

      // Close on outside click
      modal.querySelector(".arbor-modal-backdrop")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          closeDialog();
        }
      });
    });
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
