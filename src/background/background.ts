// Background service worker for Arbor extension

import { logger } from "../utils/logger";
import { getProvider } from "./providers/factory";
import type { LLMProvider } from "../content/modules/context/llm/LLMServiceFactory";

logger.debug("Background script loaded");

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  logger.info("Extension installed:", details.reason);

  if (details.reason === "install") {
    logger.info(
      "Welcome to Arbor! Configure your AI provider and API key in extension settings"
    );
  } else if (details.reason === "update") {
    logger.info("Extension updated");
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.debug("Background received message:", request.action);

  // Handle LLM API availability check (multi-provider)
  if (request.action === "check-availability") {
    const provider = request.payload?.provider as LLMProvider;
    const providerInstance = getProvider(provider);
    
    if (!providerInstance) {
      sendResponse({ success: true, available: false });
      return true;
    }

    providerInstance
      .checkAvailability()
      .then((available) => {
        sendResponse({ success: true, available });
      })
      .catch((error) => {
        logger.warn("Availability check failed:", error);
        sendResponse({
          success: false,
          available: false,
          error: error.message,
        });
      })
      .catch(() => {}); // Fallback

    return true; // Keep message channel open for async response
  }

  // Handle LLM API call (multi-provider)
  if (request.action === "llm-api-call") {
    const provider = request.payload?.provider as LLMProvider;
    const providerInstance = getProvider(provider);
    
    if (!providerInstance) {
      sendResponse({
        success: false,
        error: "No provider selected or provider not available",
      });
      return true;
    }

    providerInstance
      .makeApiCall(request.payload)
      .then((result) => {
        sendResponse({ success: true, ...result });
      })
      .catch((error) => {
        logger.error(`${provider} API error:`, error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      })
      .catch(() => {}); // Fallback

    return true; // Keep message channel open for async response
  }

  // Handle API key validation (multi-provider)
  if (request.action === "validate-api-key") {
    const provider = request.payload?.provider as LLMProvider;
    const apiKey = request.payload?.apiKey;
    const providerInstance = getProvider(provider);
    
    if (!providerInstance) {
      sendResponse({
        success: false,
        valid: false,
        error: "Provider not available",
      });
      return true;
    }

    if (!apiKey) {
      sendResponse({ success: false, valid: false, error: "API key is required" });
      return true;
    }

    providerInstance
      .validateApiKey(apiKey)
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        logger.error("API key validation error:", error);
        sendResponse({
          success: false,
          valid: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      })
      .catch(() => {}); // Fallback

    return true; // Keep message channel open for async response
  }

  // Handle tab ID request (legacy, kept for compatibility)
  if (request.action === "get-tab-id") {
    if (sender.tab && sender.tab.id) {
      sendResponse({ success: true, tabId: sender.tab.id });
    } else {
      sendResponse({
        success: false,
        error: "No tab ID available in sender",
      });
    }
    return true;
  }

  // Handle open options page request
  if (request.action === "open-options-page") {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  // Unknown action - still respond to prevent "message port closed" error
  sendResponse({ success: false, error: "Unknown action" });
  return false;
});

export {};
