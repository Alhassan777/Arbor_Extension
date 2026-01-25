/**
 * Options page script for Arbor extension
 * Handles multi-provider LLM configuration and API key management
 */

import { ConfigManager } from "./configManager";
import { AVAILABLE_MODELS, type LLMProvider } from "../content/modules/context/llm/LLMServiceFactory";
import { getProviderMetadata } from "../content/modules/context/llm/providers/config";
import { logger } from "../utils/logger";

// DOM elements
const configForm = document.getElementById("configForm") as HTMLFormElement;
const providerSelect = document.getElementById("provider") as HTMLSelectElement;
const modelSelect = document.getElementById("model") as HTMLSelectElement;
const modelGroup = document.getElementById("modelGroup") as HTMLDivElement;
const apiKeySection = document.getElementById("apiKeySection") as HTMLDivElement;
const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const apiKeyLabel = document.getElementById("apiKeyLabel") as HTMLLabelElement;
const apiKeyHelp = document.getElementById("apiKeyHelp") as HTMLElement;
const toggleVisibilityBtn = document.getElementById("toggleVisibility") as HTMLButtonElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const saveBtnText = document.getElementById("saveBtnText") as HTMLSpanElement;
const saveBtnLoading = document.getElementById("saveBtnLoading") as HTMLSpanElement;
const testBtn = document.getElementById("testBtn") as HTMLButtonElement;
const removeBtn = document.getElementById("removeBtn") as HTMLButtonElement;
const statusMessage = document.getElementById("statusMessage") as HTMLDivElement;
const apiKeyMissingBanner = document.getElementById("apiKeyMissingBanner") as HTMLDivElement;
const dismissBannerBtn = document.getElementById("dismissBanner") as HTMLButtonElement;
const providerInfoList = document.getElementById("providerInfoList") as HTMLUListElement;

// State
let isPasswordVisible = false;
let currentProvider: LLMProvider = "gemini";

/**
 * Show status message
 */
function showStatus(message: string, type: "success" | "error" | "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  if (type === "success" || type === "info") {
    setTimeout(() => {
      statusMessage.classList.remove("show");
    }, 5000);
  }
}

/**
 * Update UI based on selected provider
 */
async function updateProviderUI(provider: LLMProvider) {
  currentProvider = provider;

  // Update model options
  if (provider === "none") {
    modelGroup.style.display = "none";
    apiKeySection.style.display = "none";
    return;
  }

  modelGroup.style.display = "block";
  apiKeySection.style.display = "block";

  // Populate models
  const models = AVAILABLE_MODELS[provider] || [];
  modelSelect.innerHTML = "";
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.value;
    option.textContent = model.label;
    modelSelect.appendChild(option);
  });

  // Update API key label and help text
  const providerMetadata = getProviderMetadata(provider);
  if (providerMetadata) {
    apiKeyLabel.textContent = `${providerMetadata.name} API Key`;
    apiKeyHelp.innerHTML = `${providerMetadata.helpText} - <a href="${providerMetadata.apiKeyUrl}" target="_blank">Get API key</a>`;
    apiKeyInput.placeholder = providerMetadata.placeholder;
    
    // Update provider info
    providerInfoList.innerHTML = "";
    providerMetadata.info.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = item.replace(/^([^:]+):/, "<strong>$1:</strong>");
      providerInfoList.appendChild(li);
    });
  }

  // Load existing API key for this provider
  const config = await ConfigManager.loadConfig();
  if (config.apiKey && config.provider === provider) {
    apiKeyInput.value = ConfigManager.redactApiKey(config.apiKey, provider);
    apiKeyInput.placeholder = "API key is already saved (enter new key to replace)";
  } else {
    apiKeyInput.value = "";
  }
}

/**
 * Load and display current configuration
 */
async function loadConfig() {
  try {
    const config = await ConfigManager.loadConfig();
    currentProvider = config.provider;

    // Set provider
    providerSelect.value = config.provider;

    // Update UI
    await updateProviderUI(config.provider);

    // Set model if provider is not "none"
    if (config.provider !== "none" && config.model) {
      modelSelect.value = config.model;
    }
  } catch (error) {
    logger.error("Failed to load config:", error);
    showStatus("Failed to load configuration", "error");
  }
}

/**
 * Save configuration
 */
async function saveConfig() {
  const provider = providerSelect.value as LLMProvider;
  const model = modelSelect.value;
  const apiKey = apiKeyInput.value.trim();

  try {
    // Save config and API key using ConfigManager
    const apiKeyToSave = provider !== "none" && apiKey && !apiKey.includes("...****") ? apiKey : undefined;
    const result = await ConfigManager.saveConfig(provider, model, apiKeyToSave);
    
    if (!result.success) {
      showStatus(result.error || "Failed to save configuration", "error");
      return;
    }

    showStatus("✅ Configuration saved successfully!", "success");
    
    // Reload to show redacted key
    if (provider !== "none") {
      const savedConfig = await ConfigManager.loadConfig();
      if (savedConfig.apiKey) {
        apiKeyInput.value = ConfigManager.redactApiKey(savedConfig.apiKey, provider);
        apiKeyInput.type = "password";
        isPasswordVisible = false;
        toggleVisibilityBtn.textContent = "👁️";
      }
    }
  } catch (error) {
    logger.error("Failed to save config:", error);
    showStatus(
      error instanceof Error ? error.message : "Failed to save configuration",
      "error"
    );
  }
}

/**
 * Validate API key with background script
 * Uses ConfigManager for validation
 */
async function validateApiKey(
  apiKey: string,
  provider: LLMProvider
): Promise<{ valid: boolean; error?: string }> {
  if (provider === "none") {
    return { valid: false, error: "No provider selected" };
  }
  return ConfigManager.validateApiKey(apiKey, provider);
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
  if (currentProvider === "none") {
    apiKeyMissingBanner.style.display = "none";
    return;
  }

  const config = await ConfigManager.loadConfig();
  if (!config.apiKey) {
    const dismissed = localStorage.getItem("arbor_api_key_banner_dismissed");
    if (!dismissed) {
      apiKeyMissingBanner.style.display = "block";
    }
  } else {
    apiKeyMissingBanner.style.display = "none";
  }
}

/**
 * Navigate back to chat platform
 */
async function navigateBackToChat() {
  const platformUrls = [
    "https://chatgpt.com",
    "https://gemini.google.com/app",
    "https://claude.ai/new",
    "https://www.perplexity.ai",
  ];

  try {
    // Try to find an existing tab with one of the supported platforms
    const tabs = await chrome.tabs.query({});
    const platformTab = tabs.find((tab) =>
      tab.url && platformUrls.some((url) => tab.url?.startsWith(url))
    );

    if (platformTab && platformTab.id) {
      // Switch to existing platform tab
      await chrome.tabs.update(platformTab.id, { active: true });
      await chrome.windows.update(platformTab.windowId || 0, { focused: true });
    } else {
      // Open new tab to ChatGPT (default)
      await chrome.tabs.create({ url: "https://chatgpt.com" });
    }
  } catch (error) {
    logger.error("Failed to navigate back to chat:", error);
    // Fallback: open ChatGPT in new tab
    window.open("https://chatgpt.com", "_blank");
  }
}

/**
 * Initialize the page
 */
async function init() {
  // Load existing configuration
  await loadConfig();

  // Check and show API key missing banner
  await updateApiKeyBanner();

  // Attach back to chat button listener
  const backToChatBtn = document.getElementById("backToChatBtn");
  if (backToChatBtn) {
    backToChatBtn.addEventListener("click", navigateBackToChat);
  }

  // Event listeners
  toggleVisibilityBtn.addEventListener("click", togglePasswordVisibility);

  dismissBannerBtn.addEventListener("click", () => {
    apiKeyMissingBanner.style.display = "none";
    localStorage.setItem("arbor_api_key_banner_dismissed", "true");
  });

  providerSelect.addEventListener("change", async () => {
    const provider = providerSelect.value as LLMProvider;
    await updateProviderUI(provider);
    await updateApiKeyBanner();
  });

  configForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const provider = providerSelect.value as LLMProvider;
    const apiKey = apiKeyInput.value.trim();

    if (provider === "none") {
      // Just save config without API key
      await saveConfig();
      return;
    }

    if (!apiKey) {
      showStatus("Please enter an API key", "error");
      return;
    }

    // Don't save if it's the redacted version
    if (apiKey.includes("...****")) {
      // Just save config without updating API key
      await saveConfig();
      return;
    }

    // Validate format
    const formatValidation = ConfigManager.validateApiKeyFormat(apiKey, provider);
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
      const validation = await validateApiKey(apiKey, provider);
      if (!validation.valid) {
        showStatus(validation.error || "Invalid API key", "error");
        saveBtn.disabled = false;
        saveBtnText.style.display = "inline";
        saveBtnLoading.style.display = "none";
        return;
      }

      // Save configuration and API key
      await saveConfig();
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
    const provider = providerSelect.value as LLMProvider;
    const apiKey = apiKeyInput.value.trim();

    if (provider === "none") {
      showStatus("Please select a provider first", "error");
      return;
    }

    if (!apiKey || apiKey.includes("...****")) {
      showStatus("Please enter an API key first", "error");
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = "⏳ Testing...";

    try {
      const validation = await validateApiKey(apiKey, provider);
      if (validation.valid) {
        showStatus("✅ Connection test successful! API key is valid.", "success");
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
    const provider = providerSelect.value as LLMProvider;

    if (provider === "none") {
      showStatus("No API key to remove", "info");
      return;
    }

    const providerMetadata = getProviderMetadata(provider);
    if (
      !confirm(
        `Are you sure you want to remove your ${providerMetadata?.name || provider} API key? You'll need to enter it again to use AI features.`
      )
    ) {
      return;
    }

    removeBtn.disabled = true;
    removeBtn.textContent = "⏳ Removing...";

    try {
      const result = await ConfigManager.removeApiKey(provider);
      if (result.success) {
        showStatus("✅ API key removed successfully", "success");
        apiKeyInput.value = "";
        if (providerMetadata) {
          apiKeyInput.placeholder = providerMetadata.placeholder;
        }
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
