/**
 * LLMServiceFactory - Creates and manages LLM service instances
 */

import { GeminiLLMService } from "./providers/gemini";
import { OpenAILLMService } from "./providers/openai";
import { AnthropicLLMService } from "./providers/anthropic";
import type { LLMService } from "./LLMService";
import { getProviderConfig, getProviderModels } from "./providers/config";

// Re-export types for convenience
export type { LLMService, SummaryOptions } from "./LLMService";

export type LLMProvider = "gemini" | "openai" | "anthropic" | "none";

export interface LLMConfig {
  provider: LLMProvider;
  gemini?: {
    model?: string;
    enabled?: boolean;
  };
  openai?: {
    model?: string;
    enabled?: boolean;
  };
  anthropic?: {
    model?: string;
    enabled?: boolean;
  };
}

// Available models for each provider (from config)
export const AVAILABLE_MODELS = {
  gemini: getProviderModels("gemini"),
  openai: getProviderModels("openai"),
  anthropic: getProviderModels("anthropic"),
} as const;

export class LLMServiceFactory {
  /**
   * Create an LLM service based on configuration
   */
  static create(config: LLMConfig): LLMService | null {
    if (config.provider === "none") {
      return null;
    }

    switch (config.provider) {
      case "gemini":
        return new GeminiLLMService(config.gemini);
      case "openai":
        return new OpenAILLMService(config.openai);
      case "anthropic":
        return new AnthropicLLMService(config.anthropic);
      default:
        return null;
    }
  }

  /**
   * Get default configuration
   * Uses provider config for defaults
   */
  static getDefaultConfig(): LLMConfig {
    const geminiConfig = getProviderConfig("gemini");
    const openaiConfig = getProviderConfig("openai");
    const anthropicConfig = getProviderConfig("anthropic");

    return {
      provider: "gemini",
      gemini: {
        enabled: true,
        model: geminiConfig.defaultModel,
      },
      openai: {
        enabled: false,
        model: openaiConfig.defaultModel,
      },
      anthropic: {
        enabled: false,
        model: anthropicConfig.defaultModel,
      },
    };
  }
}
