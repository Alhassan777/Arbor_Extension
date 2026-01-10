/**
 * GeminiLLMService - Implementation using Google Gemini 2.0 Flash-Lite
 * Uses the Gemini API via background script for secure API key handling
 * Model: gemini-2.0-flash-exp (fast and efficient for summarization)
 */

import type { Message } from "../ContextFormatter";
import type { LLMService, SummaryOptions } from "./LLMService";
import type { ConnectionType } from "../../../../types";
import { logger } from "../../../../utils/logger";

interface GeminiLLMConfig {
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

export class GeminiLLMService implements LLMService {
  private config: GeminiLLMConfig;
  private defaultModel = "gemini-2.0-flash-exp";

  constructor(config: GeminiLLMConfig = {}) {
    this.config = {
      enabled: true,
      model: this.defaultModel,
      ...config,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      logger.debug("Gemini LLM is disabled in config");
      return false;
    }

    if (!isExtensionContextAvailable()) {
      logger.debug("Extension context not available for Gemini LLM");
      return false;
    }

    try {
      // Check if API key is available
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Availability check timeout"));
        }, 5000);

        chrome.runtime.sendMessage(
          {
            action: "gemini-check-availability",
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
        logger.debug("Gemini LLM availability check failed:", response?.error || "Unknown error");
        return false;
      }

      const isAvailable = response.available === true;
      if (isAvailable) {
        logger.debug("Gemini LLM is available");
      } else {
        logger.debug("Gemini LLM is not available (API key missing or invalid)");
      }

      return isAvailable;
    } catch (error) {
      logger.debug("Gemini LLM availability check failed:", error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  async summarize(
    messages: Message[],
    options: SummaryOptions = {}
  ): Promise<string> {
    const { maxLength = 200, style = "brief", customPrompt } = options;

    // Format conversation for summarization
    const conversationText = this.formatConversation(messages);

    // Build prompt - use custom prompt if provided, otherwise build based on style
    let prompt: string;
    if (customPrompt) {
      // Use custom prompt and append conversation
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

      logger.debug(`Requesting summarization from Gemini LLM (model: ${this.config.model})`);

      // Call summarization via background script
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timeout"));
        }, 30000); // 30 second timeout for API calls

        chrome.runtime.sendMessage(
          {
            action: "gemini-api-call",
            payload: {
              method: "generateContent",
              model: this.config.model,
              prompt: prompt,
              maxTokens: Math.floor(maxLength * 1.5), // Approximate token count
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

      logger.debug("Gemini LLM summarization completed");
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
            action: "gemini-api-call",
            payload: {
              method: "generateContent",
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

      // Parse bullet points from response
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
    const connectionTypes: ConnectionType[] = [
      "extends",
      "deepens",
      "explores",
      "examples",
      "applies",
      "questions",
      "contrasts",
      "summarizes",
    ];

    try {
      if (!isExtensionContextAvailable()) {
        // Fallback to heuristic if extension context unavailable
        return this.heuristicConnectionType(conversationText);
      }

      const prompt = `Based on this conversation, suggest the most appropriate connection type for continuing the discussion. Choose ONE from: extends, deepens, explores, examples, applies, questions, contrasts, summarizes.

Return ONLY the connection type word, nothing else.

Conversation:
${conversationText}`;

      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timeout"));
        }, 15000);

        chrome.runtime.sendMessage(
          {
            action: "gemini-api-call",
            payload: {
              method: "generateContent",
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
      const validType = connectionTypes.find(
        (type) => type === suggestedType
      );

      return validType || this.heuristicConnectionType(conversationText);
    } catch (error) {
      // Fallback to heuristic on error
      return this.heuristicConnectionType(conversationText);
    }
  }

  /**
   * Heuristic-based connection type suggestion (fallback)
   */
  private heuristicConnectionType(conversationText: string): ConnectionType {
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

  private formatConversation(messages: Message[]): string {
    return messages
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GeminiLLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): GeminiLLMConfig {
    return { ...this.config };
  }
}
