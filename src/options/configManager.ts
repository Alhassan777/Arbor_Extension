/**
 * Configuration Manager
 * Handles business logic for LLM configuration and API key management
 */

import {
  getApiKey,
  setApiKey,
  removeApiKey,
  validateApiKeyFormat,
  redactApiKeyForDisplay,
} from "../storage/apiKeyStorage";
import { LLMConfigManager } from "../content/modules/context/llm/LLMConfigManager";
import { LLMServiceFactory, type LLMProvider } from "../content/modules/context/llm/LLMServiceFactory";
import { getProviderMetadata, getProviderModels } from "../content/modules/context/llm/providers/config";
import { logger } from "../utils/logger";

export interface ConfigManagerResult {
  success: boolean;
  error?: string;
}

/**
 * Configuration Manager for options page
 */
export class ConfigManager {
  /**
   * Load current configuration
   */
  static async loadConfig(): Promise<{
    provider: LLMProvider;
    model: string;
    apiKey: string | null;
  }> {
    try {
      const config = await LLMConfigManager.loadConfig();
      const provider = config.provider;
      
      let model = "";
      let apiKey: string | null = null;
      
      if (provider !== "none") {
        const providerConfig = (config as any)[provider];
        model = providerConfig?.model || getProviderModels(provider)[0]?.value || "";
        apiKey = await getApiKey(provider as "gemini" | "openai" | "anthropic");
      }

      return { provider, model, apiKey };
    } catch (error) {
      logger.error("Failed to load config:", error);
      throw error;
    }
  }

  /**
   * Save configuration
   */
  static async saveConfig(
    provider: LLMProvider,
    model: string,
    apiKey?: string
  ): Promise<ConfigManagerResult> {
    try {
      // Build config
      const config: any = {
        provider,
      };

      if (provider !== "none") {
        config[provider] = {
          enabled: true,
          model,
        };
      }

      // Save config
      await LLMConfigManager.saveConfig(config);

      // Save API key if provided and not redacted
      if (provider !== "none" && apiKey && !apiKey.includes("...****")) {
        const result = await setApiKey(apiKey, provider as "gemini" | "openai" | "anthropic");
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      return { success: true };
    } catch (error) {
      logger.error("Failed to save config:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save configuration",
      };
    }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(
    apiKey: string,
    provider: LLMProvider
  ): Promise<{ valid: boolean; error?: string }> {
    if (provider === "none") {
      return { valid: false, error: "No provider selected" };
    }
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "validate-api-key",
          payload: { apiKey, provider },
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
   * Remove API key
   */
  static async removeApiKey(provider: LLMProvider): Promise<ConfigManagerResult> {
    if (provider === "none") {
      return { success: false, error: "No provider selected" };
    }
    try {
      const result = await removeApiKey(provider as "gemini" | "openai" | "anthropic");
      return result;
    } catch (error) {
      logger.error("Failed to remove API key:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove API key",
      };
    }
  }

  /**
   * Get provider metadata
   */
  static getProviderMetadata(provider: LLMProvider) {
    return getProviderMetadata(provider);
  }

  /**
   * Get provider models
   */
  static getProviderModels(provider: LLMProvider) {
    return getProviderModels(provider);
  }

  /**
   * Get redacted API key for display
   */
  static redactApiKey(key: string | null | undefined, provider: LLMProvider): string {
    if (provider === "none") {
      return "";
    }
    return redactApiKeyForDisplay(key, provider as "gemini" | "openai" | "anthropic");
  }

  /**
   * Validate API key format
   */
  static validateApiKeyFormat(key: string, provider: LLMProvider) {
    if (provider === "none") {
      return { valid: false, error: "No provider selected" };
    }
    return validateApiKeyFormat(key, provider as "gemini" | "openai" | "anthropic");
  }
}
