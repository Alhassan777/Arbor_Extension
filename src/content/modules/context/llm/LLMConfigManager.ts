/**
 * LLMConfigManager - Manages LLM configuration storage and retrieval
 * 
 * SECURITY NOTE:
 * - LLM config (provider, model) is stored in chrome.storage.local (NOT sensitive, needs to be shared across contexts)
 * - API keys are stored separately using encrypted storage (see apiKeyStorage.ts)
 */

import { db } from "../../../db";
import type { LLMConfig } from "./LLMServiceFactory";
import { LLMServiceFactory } from "./LLMServiceFactory";
import { logger } from "../../../../utils/logger";

const CONFIG_KEY = "arbor_llm_config"; // Using chrome.storage.local key

export class LLMConfigManager {
  /**
   * Load LLM configuration from storage
   * Uses chrome.storage.local for cross-context sharing (options page + content scripts)
   * NOTE: Only stores provider/model selection, NOT API keys (those are in secure storage)
   */
  static async loadConfig(): Promise<LLMConfig> {
    try {
      const result = await chrome.storage.local.get(CONFIG_KEY);
      const config = result[CONFIG_KEY] as LLMConfig | undefined;

      if (config && config.provider) {
        return config;
      }

      // Return default config if none exists
      return LLMServiceFactory.getDefaultConfig();
    } catch (error) {
      logger.warn("Failed to load LLM config (using defaults):", error);
      return LLMServiceFactory.getDefaultConfig();
    }
  }

  /**
   * Save LLM configuration to storage
   * Uses chrome.storage.local for cross-context sharing (options page + content scripts)
   * NOTE: Only stores provider/model selection, NOT API keys (those are in secure storage)
   */
  static async saveConfig(config: LLMConfig): Promise<void> {
    try {
      // Save to chrome.storage.local (shared across all extension contexts)
      await chrome.storage.local.set({
        [CONFIG_KEY]: config,
      });
      
      // Verify it was saved
      const result = await chrome.storage.local.get(CONFIG_KEY);
      const savedConfig = result[CONFIG_KEY];
      
      if (!savedConfig) {
        logger.error("Config was not saved to chrome.storage.local!");
        throw new Error("Failed to save config");
      }
    } catch (error) {
      logger.error("Failed to save LLM config:", error);
      throw error;
    }
  }

  /**
   * Get or create LLM service based on saved configuration
   */
  static async getLLMService() {
    const config = await this.loadConfig();
    return LLMServiceFactory.create(config);
  }
}
