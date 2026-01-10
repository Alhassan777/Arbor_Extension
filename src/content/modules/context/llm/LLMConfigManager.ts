/**
 * LLMConfigManager - Manages LLM configuration storage and retrieval
 */

import { db } from "../../../db";
import type { LLMConfig } from "./LLMServiceFactory";
import { LLMServiceFactory } from "./LLMServiceFactory";
import { logger } from "../../../../utils/logger";

const CONFIG_KEY = "llm_config";

export class LLMConfigManager {
  /**
   * Load LLM configuration from storage
   */
  static async loadConfig(): Promise<LLMConfig> {
    try {
      // Ensure database is initialized
      if (!db) {
        return LLMServiceFactory.getDefaultConfig();
      }

      const savedConfig = await db.getState();
      // State storage can hold arbitrary keys, so we cast to access our config
      const config = (savedConfig as any)[CONFIG_KEY] as LLMConfig | undefined;

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
   */
  static async saveConfig(config: LLMConfig): Promise<void> {
    try {
      // State storage can hold arbitrary keys, so we cast to bypass type restriction
      await db.saveState({
        [CONFIG_KEY]: config,
      } as any);
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
