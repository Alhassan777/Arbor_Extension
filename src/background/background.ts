// Background service worker for Arbor extension

import { logger } from "../utils/logger";
import { retryWithBackoff } from "../utils/retry";
import { getApiKey } from "../storage/apiKeyStorage";
import { RateLimiter } from "../utils/rateLimiter";

logger.debug("Background script loaded");

// SECURITY: Rate limiter to prevent API quota exhaustion and abuse
// Allows 20 calls per minute (generous for normal usage, prevents abuse)
const apiRateLimiter = new RateLimiter({
  maxCalls: 20,
  windowMs: 60000, // 1 minute
  identifier: 'Gemini API'
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  logger.info("Extension installed:", details.reason);

  if (details.reason === "install") {
    logger.info(
      "Welcome to Arbor! Configure your Gemini API key in extension settings"
    );
  } else if (details.reason === "update") {
    logger.info("Extension updated");
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.debug("Background received message:", request.action);

  // Handle Gemini API availability check
  if (request.action === "gemini-check-availability") {
    handleGeminiAvailabilityCheck()
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

  // Handle Gemini API call
  if (request.action === "gemini-api-call") {
    handleGeminiAPICall(request.payload)
      .then((result) => {
        sendResponse({ success: true, ...result });
      })
      .catch((error) => {
        logger.error("Gemini API error:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      })
      .catch(() => {}); // Fallback

    return true; // Keep message channel open for async response
  }

  // Handle Gemini API key validation
  if (request.action === "gemini-validate-key") {
    handleGeminiKeyValidation(request.payload?.apiKey)
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

// getApiKey is imported from apiKeyStorage module

/**
 * Check if Gemini API is available (has API key)
 */
async function handleGeminiAvailabilityCheck(): Promise<boolean> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      logger.debug("Gemini API key not found");
      return false;
    }

    // Validate format
    if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
      logger.debug("Invalid Gemini API key format");
      return false;
    }

    logger.debug("Gemini API key found");
    return true;
  } catch (error) {
    logger.error("Error checking Gemini availability:", error);
    return false;
  }
}

/**
 * Handle Gemini API call with retry logic and network checks
 */
async function handleGeminiAPICall(payload: {
  method: string;
  model?: string;
  prompt: string;
  maxTokens?: number;
}): Promise<{ text: string }> {
  const {
    method = "generateContent",
    model = "gemini-2.0-flash-exp",
    prompt,
    maxTokens = 2048,
  } = payload;

  // Get API key from secure storage (decrypted)
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key not found. Please configure it in extension settings."
    );
  }

  // Validate API key format
  if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
    throw new Error("Invalid Gemini API key format");
  }

  // SECURITY: Check rate limit before making API call
  if (!apiRateLimiter.attemptCall()) {
    const resetTimeSeconds = Math.ceil(apiRateLimiter.getTimeUntilReset() / 1000);
    const remainingCalls = apiRateLimiter.getRemainingCalls();
    throw new Error(
      `Rate limit exceeded. Please wait ${resetTimeSeconds} seconds before trying again. ` +
      `(${remainingCalls} calls remaining)`
    );
  }

  // Use retry logic for API call
  // The fetch will naturally handle network errors, and retry logic will catch them
  return retryWithBackoff(
    async () => {
      // Build Gemini API request
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      };

      logger.debug("Calling Gemini API (model:", model + ")");

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      } catch (error) {
        // Handle network errors (fetch failures)
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error(
            "Network connection unavailable. Please check your internet connection."
          );
        }
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message || response.statusText || "API error";

        // Handle specific error codes
        let safeErrorMessage = errorMessage;
        if (response.status === 401) {
          safeErrorMessage =
            "Invalid API key. Please check your API key in extension settings.";
        } else if (response.status === 403) {
          safeErrorMessage =
            "API key does not have permission to access this model.";
        } else if (response.status === 429) {
          safeErrorMessage = "Rate limit exceeded. Please try again later.";
        } else if (response.status === 400) {
          safeErrorMessage = "Invalid request: " + safeErrorMessage;
        }

        const error = new Error(
          `Gemini API error (${response.status}): ${safeErrorMessage}`
        ) as any;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      // Extract text from Gemini response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No text in Gemini API response");
      }

      return { text };
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      onRetry: (attempt, error) => {
        logger.debug(`Retrying Gemini API call (attempt ${attempt}):`, error);
      },
    }
  );
}

/**
 * Validate Gemini API key by making a lightweight test request
 */
async function handleGeminiKeyValidation(apiKey?: string): Promise<{
  success: boolean;
  valid: boolean;
  error?: string;
}> {
  if (!apiKey) {
    return { success: false, valid: false, error: "API key is required" };
  }

  // Validate format
  if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
    return {
      success: true,
      valid: false,
      error:
        "Invalid API key format (must start with 'AIza' and be at least 30 characters)",
    };
  }

  try {
    // Make a lightweight test request with retry logic
    // Network errors will be caught by the fetch and retry logic
    return await retryWithBackoff(
      async () => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

        let response: Response;
        try {
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "test",
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: 1,
              },
            }),
          });
        } catch (error) {
          // Handle network errors (fetch failures)
          if (error instanceof TypeError && error.message.includes("fetch")) {
            throw new Error(
              "Network connection unavailable. Please check your internet connection."
            );
          }
          throw error;
        }

        if (response.ok) {
          return { success: true, valid: true };
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || response.statusText;

          if (response.status === 401) {
            return {
              success: true,
              valid: false,
              error: "Invalid API key. Please check your key and try again.",
            };
          } else if (response.status === 403) {
            return {
              success: true,
              valid: false,
              error: "API key does not have permission to access this model.",
            };
          } else {
            const error = new Error(
              `API key validation failed: ${errorMessage}`
            ) as any;
            error.status = response.status;
            throw error;
          }
        }
      },
      {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 5000,
      }
    );
  } catch (error) {
    return {
      success: false,
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Network error during validation",
    };
  }
}

export {};
