/**
 * LLMServiceFactory - Creates and manages LLM service instances
 */

import { GeminiLLMService } from "./GeminiLLMService";
import type { LLMService } from "./LLMService";

// Re-export types for convenience
export type { LLMService, SummaryOptions } from "./LLMService";

export type LLMProvider = "gemini" | "none";

export interface LLMConfig {
  provider: LLMProvider;
  gemini?: {
    model?: string;
    enabled?: boolean;
  };
}

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

      default:
        return null;
    }
  }

  /**
   * Get default configuration
   * - Gemini service as default (uses Gemini 2.0 Flash-Lite)
   * - Enabled by default (requires API key from user)
   */
  static getDefaultConfig(): LLMConfig {
    return {
      provider: "gemini",
      gemini: {
        enabled: true,
        model: "gemini-2.0-flash-exp",
      },
    };
  }
}
