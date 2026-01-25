/**
 * BranchConnectionTypeDialog - Dialog for selecting connection type when creating a branch
 */

import type { ConnectionType } from "../../types";
import {
  CONNECTION_TYPES,
  type ConnectionTypeConfig,
} from "./context/connectionTypes";

// Re-export for backward compatibility
export type ConnectionTypeOption = ConnectionTypeConfig;

export interface BranchDialogResult {
  connectionType: ConnectionType;
  formatType: "hybrid" | "conversation" | "summary";
  messageLength: number | "full";
  messageCount?: number;
  customConnectionType?: string; // Custom connection type label if connectionType is 'custom'
  customPrompt?: string; // Custom summarization prompt (optional)
}

export class BranchConnectionTypeDialog {
  /**
   * Show dialog and return selected options
   * Returns the configuration if user confirms, or null if cancelled
   */
  static show(
    defaultType: ConnectionType = "extends"
  ): Promise<BranchDialogResult | null> {
    return new Promise((resolve) => {
      // Remove existing dialog if any
      document.getElementById("arbor-branch-type-dialog")?.remove();

      const modal = document.createElement("div");
      modal.id = "arbor-branch-type-dialog";

      const selectedType = { value: defaultType };
      const selectedFormat = {
        value: "hybrid" as "hybrid" | "conversation" | "summary",
      };
      const selectedLength = { value: "full" as number | "full" };

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
            max-width: 500px;
            width: 90%;
            max-height: 85vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
              <h2 style="color: #e8efe9; margin: 0; font-size: 18px; font-weight: 600;">🌿 Create Branch</h2>
              <button id="close-branch-dialog" style="
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

            <p style="color: #9caba3; margin-bottom: 20px; font-size: 13px; line-height: 1.5; flex-shrink: 0;">
              Choose how this branch relates to the current conversation:
            </p>

            <div style="
              flex: 1;
              overflow-y: auto;
              margin: 0 -24px;
              padding: 0 24px 12px 24px;
              min-height: 0;
            " id="branch-dialog-main-content">
              ${CONNECTION_TYPES.map(
                (option, index) => `
                <div class="connection-type-option" data-type="${
                  option.type
                }" style="
                  background: ${
                    option.type === defaultType ? "#1c2420" : "#131917"
                  };
                  border: 1px solid ${
                    option.type === defaultType ? "#2dd4a7" : "#2a3530"
                  };
                  border-radius: 8px;
                  padding: 14px 16px;
                  margin-bottom: ${
                    index < CONNECTION_TYPES.length - 1 ? "10px" : "0"
                  };
                  cursor: pointer;
                  transition: all 0.2s ease;
                  ${
                    option.type === defaultType
                      ? "box-shadow: 0 0 0 2px rgba(45, 212, 167, 0.2);"
                      : ""
                  }
                ">
                  <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <span style="font-size: 20px; flex-shrink: 0;">${
                      option.emoji
                    }</span>
                    <div style="flex: 1;">
                      <div style="color: #e8efe9; font-size: 13px; font-weight: 600; margin-bottom: 4px; text-transform: capitalize;">
                        ${option.type}
                      </div>
                      <div style="color: #9caba3; font-size: 12px; line-height: 1.4;">
                        ${option.description}
                      </div>
                    </div>
                    ${
                      option.type === defaultType
                        ? '<span class="arbor-checkmark" style="color: #2dd4a7; font-size: 16px; flex-shrink: 0;">✓</span>'
                        : ""
                    }
                  </div>
                </div>
              `
              ).join("")}
              
              <div id="custom-connection-input-section" style="
                margin-top: 12px;
                padding: 12px;
                background: #1c2420;
                border: 1px solid #2a3530;
                border-radius: 8px;
                display: none;
              ">
                <label style="
                  display: block;
                  color: #9caba3;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 8px;
                  font-weight: 600;
                ">Custom Connection Label</label>
                <input 
                  type="text" 
                  id="custom-connection-input" 
                  placeholder="Enter your custom connection type..."
                  style="
                    width: 100%;
                    padding: 8px 12px;
                    background: #131917;
                    color: #e8efe9;
                    border: 1px solid #2a3530;
                    border-radius: 6px;
                    font-size: 13px;
                    font-family: inherit;
                  "
                />
              </div>

              <!-- What Happens Next Preview -->
              <div id="what-happens-next-preview" style="
                margin-top: 16px;
                padding: 12px;
                background: rgba(45, 212, 167, 0.08);
                border: 1px solid rgba(45, 212, 167, 0.2);
                border-radius: 8px;
              ">
                <div style="color: #2dd4a7; font-size: 11px; font-weight: 600; margin-bottom: 6px;">
                  WHAT HAPPENS NEXT
                </div>
                <div style="color: #9caba3; font-size: 12px; line-height: 1.5;">
                  1. We'll create a summary of your conversation so far<br>
                  2. Open a new chat with this context already pasted<br>
                  3. You can immediately continue the conversation
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(45, 212, 167, 0.15);">
                  <div style="color: #9caba3; font-size: 11px;">
                    <strong style="color: #e8efe9;">Estimated context:</strong> <span id="context-estimate">~450 words (3 message pairs + summary)</span>
                  </div>
                </div>
              </div>

              <div style="
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #2a3530;
              ">
                <div id="advanced-options-toggle" style="
                  color: #9caba3;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 12px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  justify-content: space-between;
                  cursor: pointer;
                  transition: color 0.2s;
                " onmouseover="this.style.color='#2dd4a7'" onmouseout="this.style.color='#9caba3'">
                  <span style="display: flex; align-items: center; gap: 6px;">
                    <span>⚙️</span>
                    <span>Advanced Options</span>
                  </span>
                  <span id="advanced-toggle-icon" style="font-size: 14px; transition: transform 0.2s;">▼</span>
                </div>
              </div>

              <div id="advanced-options-section" style="
                margin-top: 0;
                padding: 16px;
                background: #131917;
                border: 1px solid #2a3530;
                border-radius: 8px;
                display: none;
              ">
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  color: #9caba3;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 8px;
                  font-weight: 600;
                ">Context Format</label>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#1c2420'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="format-type" value="hybrid" checked style="accent-color: #2dd4a7; cursor: pointer;">
                    <div style="flex: 1;">
                      <div style="color: #e8efe9; font-size: 13px; font-weight: 500;">Smart (Recommended)</div>
                      <div style="color: #6a7570; font-size: 11px;">
                        Quick summary + recent messages (last 3 exchanges)
                        <span style="color: #2dd4a7; margin-left: 4px;">• No AI needed</span>
                      </div>
                    </div>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#1c2420'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="format-type" value="conversation" style="accent-color: #2dd4a7; cursor: pointer;">
                    <div style="flex: 1;">
                      <div style="color: #e8efe9; font-size: 13px; font-weight: 500;">Full History</div>
                      <div style="color: #6a7570; font-size: 11px;">
                        Include recent conversation word-for-word (last 10 messages)
                        <span style="color: #2dd4a7; margin-left: 4px;">• No AI needed</span>
                      </div>
                    </div>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#1c2420'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="format-type" value="summary" style="accent-color: #2dd4a7; cursor: pointer;">
                    <div style="flex: 1;">
                      <div style="color: #e8efe9; font-size: 13px; font-weight: 500;">AI Summary</div>
                      <div style="color: #6a7570; font-size: 11px;">
                        AI creates intelligent summary of conversation
                        <span style="color: #c9a66b; margin-left: 4px;">• Uses Gemini API (requires key)</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label style="
                  display: block;
                  color: #9caba3;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 8px;
                  font-weight: 600;
                ">Message Length</label>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#1c2420'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="message-length" value="full" checked style="accent-color: #2dd4a7; cursor: pointer;">
                    <span style="color: #e8efe9; font-size: 13px;">Full messages (no truncation)</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#1c2420'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="message-length" value="500" style="accent-color: #2dd4a7; cursor: pointer;">
                    <span style="color: #e8efe9; font-size: 13px;">500 characters per message</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#1c2420'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="message-length" value="200" style="accent-color: #2dd4a7; cursor: pointer;">
                    <span style="color: #e8efe9; font-size: 13px;">200 characters per message</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#1c2420'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="message-length" value="100" style="accent-color: #2dd4a7; cursor: pointer;">
                    <span style="color: #e8efe9; font-size: 13px;">100 characters per message</span>
                  </label>
                </div>
              </div>

              <div id="message-count-section" style="
                margin-top: 16px;
                display: none;
              ">
                <label style="
                  display: block;
                  color: #9caba3;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 8px;
                  font-weight: 600;
                ">Message Count (Summary Format Only)</label>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <input 
                      type="number" 
                      id="message-count-input" 
                      min="1" 
                      max="10000" 
                      value="6" 
                      style="
                        width: 100px;
                        padding: 8px 12px;
                        background: #1c2420;
                        color: #e8efe9;
                        border: 1px solid #2a3530;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 500;
                      "
                    />
                    <span style="color: #9caba3; font-size: 12px;">messages</span>
                  </div>
                  <div id="token-estimate-display" style="
                    padding: 8px 12px;
                    background: rgba(45, 212, 167, 0.1);
                    border: 1px solid rgba(45, 212, 167, 0.2);
                    border-radius: 6px;
                    font-size: 11px;
                    color: #9caba3;
                  ">
                    Estimated tokens: <span id="token-estimate-value" style="color: #2dd4a7; font-weight: 600;">-</span> / 100,000 (Gemini 2.0 Flash-Lite)
                  </div>
                  <div id="token-warning" style="
                    padding: 8px 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 6px;
                    font-size: 11px;
                    color: #ef4444;
                    display: none;
                  ">
                    ⚠️ This exceeds the context limit. Messages will be auto-limited.
                  </div>
                </div>
              </div>

              <div id="llm-context-warning" style="
                margin-top: 16px;
                padding: 12px;
                background: rgba(45, 212, 167, 0.1);
                border: 1px solid rgba(45, 212, 167, 0.3);
                border-radius: 6px;
                display: none;
              ">
                <div style="
                  display: flex;
                  align-items: start;
                  gap: 8px;
                  margin-bottom: 8px;
                ">
                  <span style="font-size: 14px;">ℹ️</span>
                  <div style="flex: 1;">
                    <div style="color: #2dd4a7; font-size: 11px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                      AI Context Limits
                    </div>
                    <div style="color: #9caba3; font-size: 11px; line-height: 1.5;">
                      <strong>Default:</strong> Last 6 messages are sent to the AI model for summarization.<br>
                      <strong>Model:</strong> Gemini 2.0 Flash-Lite (1M token context window)<br>
                      <strong>Context Limit:</strong> 100,000 tokens (safe limit)<br>
                      <strong>Output:</strong> Max 8,192 tokens (~6,000 words)<br>
                      <strong>Auto-limiting:</strong> Messages are automatically limited if they exceed context window.<br>
                      <strong>Note:</strong> You can increase the message count significantly with Gemini's large context window.
                    </div>
              </div>

              <div id="custom-prompt-section" style="
                margin-top: 16px;
                display: none;
              ">
                <label style="
                  display: block;
                  color: #9caba3;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 8px;
                  font-weight: 600;
                ">Custom Summarization Prompt (Optional)</label>
                <textarea 
                  id="custom-prompt-input" 
                  placeholder="Enter a custom prompt for summarization. Leave empty to use default prompt. Example: 'Summarize this conversation focusing on technical details and key decisions...'"
                  rows="4"
                  style="
                    width: 100%;
                    padding: 8px 12px;
                    background: #1c2420;
                    color: #e8efe9;
                    border: 1px solid #2a3530;
                    border-radius: 6px;
                    font-size: 12px;
                    font-family: inherit;
                    resize: vertical;
                    min-height: 80px;
                  "
                ></textarea>
                <div style="
                  margin-top: 6px;
                  font-size: 10px;
                  color: #6a7570;
                  line-height: 1.4;
                ">
                  💡 If provided, this custom prompt will be used instead of the default. The conversation will be appended to your prompt.
                </div>
              </div>
            </div>
            </div>

            <div style="
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #2a3530;
              display: flex;
              gap: 10px;
              flex-shrink: 0;
            ">
              <button id="cancel-branch-dialog" style="
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
              <button id="confirm-branch-dialog" style="
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
                Create Branch
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Add custom scrollbar styling for dialog content
      const style = document.createElement("style");
      style.textContent = `
        #branch-dialog-main-content::-webkit-scrollbar {
          width: 8px;
        }
        #branch-dialog-main-content::-webkit-scrollbar-track {
          background: #131917;
          border-radius: 4px;
        }
        #branch-dialog-main-content::-webkit-scrollbar-thumb {
          background: #2a3530;
          border-radius: 4px;
        }
        #branch-dialog-main-content::-webkit-scrollbar-thumb:hover {
          background: #4a5854;
        }
      `;
      document.head.appendChild(style);

      // Handle custom connection input visibility
      const customConnectionSection = modal.querySelector(
        "#custom-connection-input-section"
      ) as HTMLElement;
      const customConnectionInput = modal.querySelector(
        "#custom-connection-input"
      ) as HTMLInputElement;

      // Initialize custom connection section visibility based on default selection
      if (customConnectionSection) {
        if (defaultType === "custom") {
          customConnectionSection.style.display = "block";
        } else {
          customConnectionSection.style.display = "none";
        }
      }

      // Handle option selection
      modal.querySelectorAll(".connection-type-option").forEach((option) => {
        option.addEventListener("click", () => {
          const type = (option as HTMLElement).dataset.type as ConnectionType;
          selectedType.value = type;

          // Show/hide custom connection input
          if (customConnectionSection) {
            if (type === "custom") {
              customConnectionSection.style.display = "block";
            } else {
              customConnectionSection.style.display = "none";
            }
          }

          // Remove ALL checkmarks from ALL options first
          modal.querySelectorAll(".arbor-checkmark").forEach((checkmark) => {
            checkmark.remove();
          });

          // Update visual selection
          modal.querySelectorAll(".connection-type-option").forEach((opt) => {
            const optEl = opt as HTMLElement;
            const optType = optEl.dataset.type as ConnectionType;
            
            if (optType === type) {
              optEl.style.background = "#1c2420";
              optEl.style.borderColor = "#2dd4a7";
              optEl.style.boxShadow = "0 0 0 2px rgba(45, 212, 167, 0.2)";
              // Add checkmark to selected option
              const checkmark = document.createElement("span");
              checkmark.className = "arbor-checkmark";
              checkmark.style.cssText =
                "color: #2dd4a7; font-size: 16px; flex-shrink: 0;";
              checkmark.textContent = "✓";
              const flexContainer = optEl.querySelector("div[style*='display: flex']");
              if (flexContainer) {
                flexContainer.appendChild(checkmark);
              }
            } else {
              optEl.style.background = "#131917";
              optEl.style.borderColor = "#2a3530";
              optEl.style.boxShadow = "";
            }
          });
        });

        // Hover effects
        option.addEventListener("mouseenter", () => {
          const type = (option as HTMLElement).dataset.type as ConnectionType;
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

      // Advanced options are always visible now
      const advancedSection = modal.querySelector(
        "#advanced-options-section"
      ) as HTMLElement;

      // Handle format type selection - also get initial checked value
      const contextWarning = modal.querySelector(
        "#llm-context-warning"
      ) as HTMLElement;
      const messageCountSection = modal.querySelector(
        "#message-count-section"
      ) as HTMLElement;
      const messageCountInput = modal.querySelector(
        "#message-count-input"
      ) as HTMLInputElement;
      const tokenEstimateValue = modal.querySelector(
        "#token-estimate-value"
      ) as HTMLElement;
      const tokenWarning = modal.querySelector("#token-warning") as HTMLElement;

      // Function to estimate tokens (simplified - would need actual TokenEstimator in real implementation)
      const estimateTokensForMessages = (count: number): number => {
        // Rough estimate: ~150 tokens per message on average
        // This is a simplified estimate for UI purposes
        const tokensPerMessage = 150;
        const promptOverhead = 50;
        return count * tokensPerMessage + promptOverhead;
      };

      // Handle custom prompt section visibility
      const customPromptSection = modal.querySelector(
        "#custom-prompt-section"
      ) as HTMLElement;
      const customPromptInput = modal.querySelector(
        "#custom-prompt-input"
      ) as HTMLTextAreaElement;

      // Function to update token estimate display
      const updateTokenEstimate = (messageCount: number) => {
        const estimated = estimateTokensForMessages(messageCount);
        if (tokenEstimateValue) {
          tokenEstimateValue.textContent = estimated.toLocaleString();
          // Color code based on limit (100000 for Gemini)
          if (estimated > 100000) {
            tokenEstimateValue.style.color = "#ef4444";
            if (tokenWarning) {
              tokenWarning.style.display = "block";
            }
          } else if (estimated > 80000) {
            tokenEstimateValue.style.color = "#f59e0b";
            if (tokenWarning) {
              tokenWarning.style.display = "none";
            }
          } else {
            tokenEstimateValue.style.color = "#2dd4a7";
            if (tokenWarning) {
              tokenWarning.style.display = "none";
            }
          }
        }
      };

      modal.querySelectorAll('input[name="format-type"]').forEach((radio) => {
        const radioEl = radio as HTMLInputElement;
        if (radioEl.checked) {
          selectedFormat.value = radioEl.value as
            | "hybrid"
            | "conversation"
            | "summary";
          // Show warning, message count, and custom prompt if summary is selected
          if (radioEl.value === "summary") {
            if (contextWarning) contextWarning.style.display = "block";
            if (messageCountSection)
              messageCountSection.style.display = "block";
            if (customPromptSection)
              customPromptSection.style.display = "block";
            updateTokenEstimate(parseInt(messageCountInput?.value || "6", 10));
          } else {
            if (contextWarning) contextWarning.style.display = "none";
            if (messageCountSection) messageCountSection.style.display = "none";
            if (customPromptSection) customPromptSection.style.display = "none";
          }
        }
        radio.addEventListener("change", (e) => {
          const value = (e.target as HTMLInputElement).value;
          selectedFormat.value = value as "hybrid" | "conversation" | "summary";
          // Show/hide context warning, message count, and custom prompt based on format type
          if (value === "summary") {
            if (contextWarning) contextWarning.style.display = "block";
            if (messageCountSection)
              messageCountSection.style.display = "block";
            if (customPromptSection)
              customPromptSection.style.display = "block";
            updateTokenEstimate(parseInt(messageCountInput?.value || "6", 10));
          } else {
            if (contextWarning) contextWarning.style.display = "none";
            if (messageCountSection) messageCountSection.style.display = "none";
            if (customPromptSection) customPromptSection.style.display = "none";
          }
        });
      });

      // Handle message count input changes
      if (messageCountInput) {
        messageCountInput.addEventListener("input", (e) => {
          const value = parseInt((e.target as HTMLInputElement).value, 10);
          // Validate range
          if (value < 1) {
            (e.target as HTMLInputElement).value = "1";
          } else if (value > 10000) {
            (e.target as HTMLInputElement).value = "10000";
          }
          updateTokenEstimate(
            parseInt((e.target as HTMLInputElement).value, 10)
          );
        });
      }

      // Handle message length selection - also get initial checked value
      modal
        .querySelectorAll('input[name="message-length"]')
        .forEach((radio) => {
          const radioEl = radio as HTMLInputElement;
          if (radioEl.checked) {
            const value = radioEl.value;
            selectedLength.value =
              value === "full" ? "full" : parseInt(value, 10);
          }
          radio.addEventListener("change", (e) => {
            const value = (e.target as HTMLInputElement).value;
            selectedLength.value =
              value === "full" ? "full" : parseInt(value, 10);
          });
        });

      // Handle advanced options toggle
      const advancedOptionsToggle = modal.querySelector("#advanced-options-toggle");
      const advancedOptionsSection = modal.querySelector("#advanced-options-section");
      const advancedToggleIcon = modal.querySelector("#advanced-toggle-icon");
      
      if (advancedOptionsToggle && advancedOptionsSection) {
        advancedOptionsToggle.addEventListener("click", () => {
          const isHidden = (advancedOptionsSection as HTMLElement).style.display === "none";
          (advancedOptionsSection as HTMLElement).style.display = isHidden ? "block" : "none";
          if (advancedToggleIcon) {
            (advancedToggleIcon as HTMLElement).style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
          }
        });
      }

      // Handle confirm button
      modal
        .querySelector("#confirm-branch-dialog")
        ?.addEventListener("click", () => {
          // Validate custom connection type if selected
          if (selectedType.value === "custom") {
            const customValue = customConnectionInput?.value.trim();
            if (!customValue) {
              alert(
                "Please enter a custom connection type label or select a different connection type."
              );
              return;
            }
          }

          modal.remove();

          // Read format type directly from checked radio button to avoid race conditions
          const checkedFormatRadio = modal.querySelector(
            'input[name="format-type"]:checked'
          ) as HTMLInputElement;
          const formatType = (checkedFormatRadio?.value ||
            selectedFormat.value) as "hybrid" | "conversation" | "summary";

          // Read message length directly from checked radio button
          const checkedLengthRadio = modal.querySelector(
            'input[name="message-length"]:checked'
          ) as HTMLInputElement;
          const messageLengthValue =
            checkedLengthRadio?.value || String(selectedLength.value);
          const finalMessageLength: number | "full" =
            messageLengthValue === "full"
              ? "full"
              : parseInt(messageLengthValue, 10);

          // Get message count from input (only relevant for Summary format)
          const messageCountValue = messageCountInput
            ? parseInt(messageCountInput.value, 10)
            : formatType === "summary"
            ? 6
            : undefined;

          // Get custom connection type if "custom" is selected
          const customConnectionTypeValue =
            selectedType.value === "custom" && customConnectionInput
              ? customConnectionInput.value.trim()
              : undefined;

          // Get custom prompt if provided
          const customPromptValue =
            formatType === "summary" && customPromptInput
              ? customPromptInput.value.trim() || undefined
              : undefined;

          resolve({
            connectionType: selectedType.value,
            formatType,
            messageLength: finalMessageLength,
            messageCount: messageCountValue,
            customConnectionType: customConnectionTypeValue,
            customPrompt: customPromptValue,
          });
        });

      // Handle cancel button and close button
      const closeDialog = () => {
        modal.remove();
        resolve(null);
      };

      modal
        .querySelector("#cancel-branch-dialog")
        ?.addEventListener("click", closeDialog);
      modal
        .querySelector("#close-branch-dialog")
        ?.addEventListener("click", closeDialog);

      // Close on outside click
      modal
        .querySelector("div[style*='position: fixed']")
        ?.addEventListener("click", (e) => {
          if (e.target === e.currentTarget) {
            closeDialog();
          }
        });
    });
  }
}
