/**
 * BaseLLMService - Base class for all LLM service implementations
 * Contains shared logic for all providers
 */

import type { Message } from "../../ContextFormatter";
import type { LLMService, SummaryOptions } from "../LLMService";
import type { ConnectionType } from "../../../../../types";
import type { LLMProvider } from "../LLMServiceFactory";
import { logger } from "../../../../../utils/logger";
import { getProviderConfig } from "./config";
import {
  getSuggestableConnectionTypes,
  isValidConnectionType,
} from "../../connectionTypes";

export interface BaseLLMConfig {
  model?: string;
  enabled?: boolean;
}

/**
 * Check if extension context is available
 */
function isExtensionContextAvailable(): boolean {
  try {
    return !!chrome?.runtime?.sendMessage;
  } catch {
    return false;
  }
}

export abstract class BaseLLMService implements LLMService {
  protected config: BaseLLMConfig;
  protected provider: LLMProvider;
  protected providerConfig: ReturnType<typeof getProviderConfig>;

  constructor(provider: LLMProvider, config: BaseLLMConfig = {}) {
    this.provider = provider;
    this.providerConfig = getProviderConfig(provider);
    this.config = {
      enabled: true,
      model: this.providerConfig.defaultModel,
      ...config,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    if (!isExtensionContextAvailable()) {
      return false;
    }

    try {
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Availability check timeout"));
        }, 5000);

        chrome.runtime.sendMessage(
          {
            action: "check-availability",
            payload: { provider: this.provider },
          },
          (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(response);
          }
        );
      });

      if (!response || !response.success) {
        return false;
      }

      return response.available === true;
    } catch (error) {
      return false;
    }
  }

  async summarize(
    messages: Message[],
    options: SummaryOptions = {}
  ): Promise<string> {
    const { maxLength = 200, style = "brief", customPrompt } = options;

    const conversationText = this.formatConversation(messages);

    let prompt: string;
    if (customPrompt) {
      prompt = `${customPrompt}\n\n${conversationText}`;
    } else if (style === "detailed") {
      prompt = `Summarize the following conversation in detail, capturing key points, decisions, and context. Keep it concise but comprehensive (around ${maxLength} words):\n\n${conversationText}`;
    } else if (style === "bullet") {
      prompt = `Extract the key points from this conversation as a bulleted list (around ${maxLength} words total):\n\n${conversationText}`;
    } else {
      prompt = `Summarize the following conversation briefly, focusing on the main topic and key points (around ${maxLength} words):\n\n${conversationText}`;
    }

    try {
      if (!isExtensionContextAvailable()) {
        throw new Error(
          "Extension context not available. Please reload the page."
        );
      }


      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timeout"));
        }, 30000);

        chrome.runtime.sendMessage(
          {
            action: "llm-api-call",
            payload: {
              provider: this.provider,
              model: this.config.model,
              prompt: prompt,
              maxTokens: Math.max(1000, Math.floor(maxLength * 2.5)), // At least 1000 tokens, or 2.5x word count
            },
          },
          (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!response) {
              reject(
                new Error(
                  "Extension context invalidated. Please reload the page."
                )
              );
              return;
            }
            resolve(response);
          }
        );
      });

      if (!response.success) {
        const errorMsg = response.error || "Summarization failed";
        throw new Error(errorMsg);
      }

      return response.text?.trim() || "";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  async extractKeyPoints(messages: Message[]): Promise<string[]> {
    const conversationText = this.formatConversation(messages);

    try {
      if (!isExtensionContextAvailable()) {
        throw new Error(
          "Extension context not available. Please reload the page."
        );
      }

      const prompt = `Extract 3-5 key points from this conversation. Return each point on a new line with a bullet point:\n\n${conversationText}`;

      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timeout"));
        }, 30000);

        chrome.runtime.sendMessage(
          {
            action: "llm-api-call",
            payload: {
              provider: this.provider,
              model: this.config.model,
              prompt: prompt,
              maxTokens: 300,
            },
          },
          (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!response) {
              reject(
                new Error(
                  "Extension context invalidated. Please reload the page."
                )
              );
              return;
            }
            resolve(response);
          }
        );
      });

      if (!response.success) {
        throw new Error(response.error || "Key extraction failed");
      }

      const text = response.text?.trim() || "";
      const points = text
        .split(/\n+/)
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[•\-\*]\s*/, "").trim())
        .filter((point: string) => point.length > 10)
        .slice(0, 5);

      return points.length > 0 ? points : [text || "No key points extracted"];
    } catch (error) {
      throw error;
    }
  }

  async suggestConnectionType(messages: Message[]): Promise<ConnectionType> {
    const conversationText = this.formatConversation(messages);
    const suggestableTypes = getSuggestableConnectionTypes();
    const typeList = suggestableTypes.join(", ");

    try {
      if (!isExtensionContextAvailable()) {
        return this.heuristicConnectionType(conversationText);
      }

      const prompt = `Based on this conversation, suggest the most appropriate connection type for continuing the discussion. Choose ONE from: ${typeList}.

Return ONLY the connection type word, nothing else.

Conversation:
${conversationText}`;

      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timeout"));
        }, 15000);

        chrome.runtime.sendMessage(
          {
            action: "llm-api-call",
            payload: {
              provider: this.provider,
              model: this.config.model,
              prompt: prompt,
              maxTokens: 10,
            },
          },
          (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!response) {
              reject(
                new Error(
                  "Extension context invalidated. Please reload the page."
                )
              );
              return;
            }
            resolve(response);
          }
        );
      });

      if (!response.success) {
        return this.heuristicConnectionType(conversationText);
      }

      const suggestedType = response.text?.trim().toLowerCase() || "";
      
      // Validate the suggested type is a valid, suggestable connection type
      if (isValidConnectionType(suggestedType) && suggestableTypes.includes(suggestedType)) {
        return suggestedType;
      }

      // Fallback to heuristic if LLM returned invalid type
      return this.heuristicConnectionType(conversationText);
    } catch (error) {
      return this.heuristicConnectionType(conversationText);
    }
  }

  protected heuristicConnectionType(conversationText: string): ConnectionType {
    const text = conversationText.toLowerCase();
    if (text.includes("example") || text.includes("instance")) {
      return "examples";
    }
    if (text.includes("question") || text.includes("?")) {
      return "questions";
    }
    if (text.includes("different") || text.includes("alternative")) {
      return "contrasts";
    }
    if (text.includes("apply") || text.includes("use")) {
      return "applies";
    }
    if (text.includes("deep") || text.includes("detail")) {
      return "deepens";
    }
    if (text.includes("explore") || text.includes("related")) {
      return "explores";
    }
    if (text.includes("summary") || text.includes("summarize")) {
      return "summarizes";
    }
    return "extends";
  }

  protected formatConversation(messages: Message[]): string {
    return messages
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  }

  updateConfig(config: Partial<BaseLLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): BaseLLMConfig {
    return { ...this.config };
  }
}
