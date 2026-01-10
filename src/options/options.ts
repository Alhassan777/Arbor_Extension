/**
 * Options page script for Arbor extension
 * Handles API key management UI
 */

// Import the secure storage utility functions
import {
  setApiKey,
  getApiKey,
  removeApiKey,
  validateApiKeyFormat,
} from "../storage/apiKeyStorage";
import { logger } from "../utils/logger";

// DOM elements
const apiKeyForm = document.getElementById("apiKeyForm") as HTMLFormElement;
const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const toggleVisibilityBtn = document.getElementById(
  "toggleVisibility"
) as HTMLButtonElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const saveBtnText = document.getElementById("saveBtnText") as HTMLSpanElement;
const saveBtnLoading = document.getElementById(
  "saveBtnLoading"
) as HTMLSpanElement;
const testBtn = document.getElementById("testBtn") as HTMLButtonElement;
const removeBtn = document.getElementById("removeBtn") as HTMLButtonElement;
const statusMessage = document.getElementById(
  "statusMessage"
) as HTMLDivElement;
const apiKeyMissingBanner = document.getElementById(
  "apiKeyMissingBanner"
) as HTMLDivElement;
const dismissBannerBtn = document.getElementById(
  "dismissBanner"
) as HTMLButtonElement;

// State
let isPasswordVisible = false;

/**
 * Redact API key for display in UI
 */
function redactApiKey(key: string | null | undefined): string {
  if (!key) return "[no key]";
  if (key.length <= 10) return "[invalid]";
  return `${key.substring(0, 7)}...****`;
}

/**
 * Show status message
 */
function showStatus(message: string, type: "success" | "error" | "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  // Auto-hide after 5 seconds for success/info messages
  if (type === "success" || type === "info") {
    setTimeout(() => {
      statusMessage.classList.remove("show");
    }, 5000);
  }
}

/**
 * Load existing API key (masked) using encrypted storage
 */
async function loadApiKeyForDisplay() {
  try {
    const key = await getApiKey();
    return key;
  } catch (error) {
    logger.error("Failed to load API key:", error);
    return null;
  }
}

// saveApiKey is imported from apiKeyStorage module

// removeApiKey is imported from apiKeyStorage module

/**
 * Validate API key with background script
 */
async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        action: "gemini-validate-key",
        payload: { apiKey },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            valid: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        if (response && response.success) {
          resolve({
            valid: response.valid,
            error: response.error,
          });
        } else {
          resolve({
            valid: false,
            error: response?.error || "Validation failed",
          });
        }
      }
    );
  });
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
  isPasswordVisible = !isPasswordVisible;
  apiKeyInput.type = isPasswordVisible ? "text" : "password";
  toggleVisibilityBtn.textContent = isPasswordVisible ? "🙈" : "👁️";
}

/**
 * Show or hide API key missing banner
 */
async function updateApiKeyBanner() {
  const existingKey = await loadApiKeyForDisplay();
  if (!existingKey) {
    // Check if user has dismissed the banner (stored in localStorage)
    const dismissed = localStorage.getItem("arbor_api_key_banner_dismissed");
    if (!dismissed) {
      apiKeyMissingBanner.style.display = "block";
    }
  } else {
    apiKeyMissingBanner.style.display = "none";
  }
}

/**
 * Initialize the page
 */
async function init() {
  // Load existing API key
  const existingKey = await loadApiKeyForDisplay();
  if (existingKey) {
    // Show masked version: show first 7 chars + dots
    apiKeyInput.value = redactApiKey(existingKey);
    apiKeyInput.placeholder =
      "API key is already saved (enter new key to replace)";
  }

  // Check and show API key missing banner
  await updateApiKeyBanner();

  // Event listeners
  toggleVisibilityBtn.addEventListener("click", togglePasswordVisibility);

  // Dismiss banner handler
  dismissBannerBtn.addEventListener("click", () => {
    apiKeyMissingBanner.style.display = "none";
    localStorage.setItem("arbor_api_key_banner_dismissed", "true");
  });

  apiKeyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter an API key", "error");
      return;
    }

    // Don't save if it's the redacted version
    if (apiKey.includes("...****")) {
      showStatus(
        "Please enter a new API key (the current key is hidden for security)",
        "info"
      );
      return;
    }

    // Validate format
    const formatValidation = validateApiKeyFormat(apiKey);
    if (!formatValidation.valid) {
      showStatus(formatValidation.error || "Invalid API key format", "error");
      return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtnText.style.display = "none";
    saveBtnLoading.style.display = "inline";

    try {
      // Validate with API
      const validation = await validateApiKey(apiKey);
      if (!validation.valid) {
        showStatus(validation.error || "Invalid API key", "error");
        saveBtn.disabled = false;
        saveBtnText.style.display = "inline";
        saveBtnLoading.style.display = "none";
        return;
      }

      // Save the key
      const result = await setApiKey(apiKey);
      if (result.success) {
        showStatus("✅ API key saved successfully!", "success");
        apiKeyInput.value = redactApiKey(apiKey);
        apiKeyInput.type = "password";
        isPasswordVisible = false;
        toggleVisibilityBtn.textContent = "👁️";
        // Hide banner after successful save
        await updateApiKeyBanner();
      } else {
        showStatus(result.error || "Failed to save API key", "error");
      }
    } catch (error) {
      showStatus(
        error instanceof Error ? error.message : "Failed to validate API key",
        "error"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtnText.style.display = "inline";
      saveBtnLoading.style.display = "none";
    }
  });

  testBtn.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey || apiKey.includes("...****")) {
      showStatus("Please enter an API key first", "error");
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = "⏳ Testing...";

    try {
      const validation = await validateApiKey(apiKey);
      if (validation.valid) {
        showStatus(
          "✅ Connection test successful! API key is valid.",
          "success"
        );
      } else {
        showStatus(validation.error || "Connection test failed", "error");
      }
    } catch (error) {
      showStatus(
        error instanceof Error ? error.message : "Connection test failed",
        "error"
      );
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";
    }
  });

  removeBtn.addEventListener("click", async () => {
    if (
      !confirm(
        "Are you sure you want to remove your API key? You'll need to enter it again to use Gemini features."
      )
    ) {
      return;
    }

    removeBtn.disabled = true;
    removeBtn.textContent = "⏳ Removing...";

    try {
      const result = await removeApiKey();
      if (result.success) {
        showStatus("✅ API key removed successfully", "success");
        apiKeyInput.value = "";
        apiKeyInput.placeholder = "AIza...";
        // Show banner after removal
        await updateApiKeyBanner();
      } else {
        showStatus(result.error || "Failed to remove API key", "error");
      }
    } catch (error) {
      showStatus(
        error instanceof Error ? error.message : "Failed to remove API key",
        "error"
      );
    } finally {
      removeBtn.disabled = false;
      removeBtn.textContent = "Remove Key";
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
