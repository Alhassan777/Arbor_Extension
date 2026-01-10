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
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          z-index: 99999999;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background: #1a1a1a;
            border: 1px solid #2a3530;
            border-radius: 12px;
            padding: 24px;
            max-width: 480px;
            width: 90%;
            max-height: 85vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="color: #e8efe9; margin: 0; font-size: 18px; font-weight: 600;">🏷️ Label Connection</h2>
              <button id="close-connection-label-dialog" style="
                background: none;
                border: none;
                color: #9caba3;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
              " onmouseover="this.style.background='#2a3530'" onmouseout="this.style.background='transparent'">×</button>
            </div>

            <div style="
              background: #131917;
              border: 1px solid #2a3530;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 20px;
            ">
              <div style="color: #9caba3; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600;">
                Connection
              </div>
              <div style="color: #e8efe9; font-size: 13px; font-weight: 500; margin-bottom: 6px;">
                From: <span style="color: #9caba3; font-weight: 400;">${escapedParentTitle}</span>
              </div>
              <div style="color: #2dd4a7; font-size: 16px; text-align: center; margin: 4px 0;">↓</div>
              <div style="color: #e8efe9; font-size: 13px; font-weight: 500;">
                To: <span style="color: #9caba3; font-weight: 400;">${escapedChildTitle}</span>
              </div>
            </div>

            <p style="color: #9caba3; margin-bottom: 16px; font-size: 13px; line-height: 1.5;">
              How does this connection relate?
            </p>

            <div style="
              flex: 1;
              overflow-y: auto;
              margin: 0 -24px;
              padding: 0 24px;
              max-height: 300px;
            ">
              ${CONNECTION_TYPES.map(
                (option, index) => {
                  const isSelected = !isCustom && option.type === (currentLabel || "extends");
                  return `
                    <div class="connection-label-option" data-type="${option.type}" style="
                      background: ${isSelected ? "#1c2420" : "#131917"};
                      border: 1px solid ${isSelected ? "#2dd4a7" : "#2a3530"};
                      border-radius: 8px;
                      padding: 12px 14px;
                      margin-bottom: ${index < CONNECTION_TYPES.length - 1 ? "8px" : "0"};
                      cursor: pointer;
                      transition: all 0.2s ease;
                      ${isSelected ? "box-shadow: 0 0 0 2px rgba(45, 212, 167, 0.2);" : ""}
                    ">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 18px; flex-shrink: 0;">${option.emoji}</span>
                        <div style="flex: 1;">
                          <div style="color: #e8efe9; font-size: 13px; font-weight: 600; margin-bottom: 2px; text-transform: capitalize;">
                            ${option.type}
                          </div>
                          <div style="color: #9caba3; font-size: 11px; line-height: 1.4;">
                            ${option.description}
                          </div>
                        </div>
                        ${isSelected ? '<span style="color: #2dd4a7; font-size: 16px; flex-shrink: 0;">✓</span>' : ""}
                      </div>
                    </div>
                  `;
                }
              ).join("")}
              ${
                allowCustom
                  ? `
                <div style="
                  margin-top: 12px;
                  padding-top: 12px;
                  border-top: 1px solid #2a3530;
                ">
                  <div style="color: #9caba3; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600;">
                    Custom Label
                  </div>
                  <input 
                    type="text" 
                    id="custom-label-input" 
                    placeholder="Enter custom label..."
                    value="${escapedCurrentLabel}"
                    style="
                      width: 100%;
                      padding: 10px 12px;
                      background: #131917;
                      border: 1px solid ${isCustom ? "#2dd4a7" : "#2a3530"};
                      border-radius: 6px;
                      color: #e8efe9;
                      font-size: 13px;
                      font-family: inherit;
                      box-sizing: border-box;
                      transition: all 0.2s ease;
                    "
                    onfocus="this.style.borderColor='#2dd4a7'; this.style.boxShadow='0 0 0 2px rgba(45, 212, 167, 0.1)'"
                    onblur="this.style.borderColor='#2a3530'; this.style.boxShadow='none'"
                  />
                </div>
              `
                  : ""
              }
            </div>

            <div style="
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #2a3530;
              display: flex;
              gap: 10px;
            ">
              <button id="cancel-connection-label-dialog" style="
                flex: 1;
                padding: 10px 16px;
                background: #1c2420;
                color: #9caba3;
                border: 1px solid #2a3530;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s ease;
              " onmouseover="this.style.background='#22291f'; this.style.borderColor='#4a5854'" onmouseout="this.style.background='#1c2420'; this.style.borderColor='#2a3530'">
                Cancel
              </button>
              <button id="confirm-connection-label-dialog" style="
                flex: 1;
                padding: 10px 16px;
                background: linear-gradient(135deg, #2dd4a7 0%, #1eb88a 100%);
                color: #0c0f0e;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(45, 212, 167, 0.2);
              " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(45, 212, 167, 0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(45, 212, 167, 0.2)'">
                Save Label
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const customInput = modal.querySelector("#custom-label-input") as HTMLInputElement;

      // Handle option selection
      modal.querySelectorAll(".connection-label-option").forEach((option) => {
        option.addEventListener("click", () => {
          const type = (option as HTMLElement).dataset.type as ConnectionType;
          selectedType.value = type;

          // Clear custom input
          if (customInput) {
            customInput.value = "";
            customInput.style.borderColor = "#2a3530";
            customInput.style.boxShadow = "none";
          }

          // Update visual selection
          modal.querySelectorAll(".connection-label-option").forEach((opt) => {
            const optEl = opt as HTMLElement;
            const optType = optEl.dataset.type as ConnectionType;
            if (optType === type) {
              optEl.style.background = "#1c2420";
              optEl.style.borderColor = "#2dd4a7";
              optEl.style.boxShadow = "0 0 0 2px rgba(45, 212, 167, 0.2)";
              // Add checkmark if not present
              if (!optEl.querySelector('span[style*="color: #2dd4a7"]')) {
                const checkmark = document.createElement("span");
                checkmark.style.cssText = "color: #2dd4a7; font-size: 16px; flex-shrink: 0;";
                checkmark.textContent = "✓";
                optEl.querySelector("div[style*='display: flex']")?.appendChild(checkmark);
              }
            } else {
              optEl.style.background = "#131917";
              optEl.style.borderColor = "#2a3530";
              optEl.style.boxShadow = "";
              // Remove checkmark
              optEl.querySelector('span[style*="color: #2dd4a7"]')?.remove();
            }
          });
        });

        // Hover effects
        option.addEventListener("mouseenter", () => {
          const type = (option as HTMLElement).dataset.type as ConnectionType;
          if (type !== selectedType.value && typeof selectedType.value === 'string' && !CONNECTION_TYPES.find(t => t.type === selectedType.value)) {
            return; // Don't change hover if custom is selected
          }
          if (type !== selectedType.value) {
            (option as HTMLElement).style.background = "#1c2420";
            (option as HTMLElement).style.borderColor = "#4a5854";
          }
        });
        option.addEventListener("mouseleave", () => {
          const type = (option as HTMLElement).dataset.type as ConnectionType;
          if (type !== selectedType.value) {
            (option as HTMLElement).style.background = "#131917";
            (option as HTMLElement).style.borderColor = "#2a3530";
          }
        });
      });

      // Handle custom input
      if (customInput) {
        customInput.addEventListener("input", () => {
          const value = customInput.value.trim();
          if (value) {
            selectedType.value = value;
            // Clear selection from options
            modal.querySelectorAll(".connection-label-option").forEach((opt) => {
              (opt as HTMLElement).style.background = "#131917";
              (opt as HTMLElement).style.borderColor = "#2a3530";
              (opt as HTMLElement).style.boxShadow = "";
              opt.querySelector('span[style*="color: #2dd4a7"]')?.remove();
            });
            customInput.style.borderColor = "#2dd4a7";
            customInput.style.boxShadow = "0 0 0 2px rgba(45, 212, 167, 0.2)";
          } else {
            customInput.style.borderColor = "#2a3530";
            customInput.style.boxShadow = "none";
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
      modal.querySelector("div[style*='position: fixed']")?.addEventListener("click", (e) => {
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
