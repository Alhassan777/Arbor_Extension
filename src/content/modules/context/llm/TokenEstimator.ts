/**
 * TokenEstimator - Estimates token count for messages and prompts
 * Uses conservative estimation: 1 token ≈ 4 characters
 */

import type { Message } from "../ContextFormatter";

export class TokenEstimator {
  // Constants for token estimation
  private static readonly TOKEN_CHAR_RATIO = 4; // 1 token per 4 characters (conservative)
  private static readonly MAX_INPUT_TOKENS = 100000; // Gemini 2.0 Flash-Lite supports up to 1M tokens, using 100K as safe limit
  private static readonly PROMPT_OVERHEAD = 50; // Base prompt text tokens
  private static readonly ROLE_LABEL_OVERHEAD = 8; // "User: " or "Assistant: " overhead
  private static readonly MESSAGE_SEPARATOR_OVERHEAD = 2; // "\n\n" between messages

  /**
   * Estimate tokens for plain text
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  static estimateTokens(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }
    // Conservative estimation: 1 token per 4 characters
    return Math.ceil(text.length / this.TOKEN_CHAR_RATIO);
  }

  /**
   * Estimate tokens for a single message with formatting
   * @param message - Message to estimate
   * @returns Estimated token count including formatting overhead
   */
  static estimateMessageTokens(message: Message): number {
    if (!message || !message.content) {
      return 0;
    }

    const contentTokens = this.estimateTokens(message.content);
    const roleLabelTokens = this.ROLE_LABEL_OVERHEAD;
    
    return contentTokens + roleLabelTokens;
  }

  /**
   * Estimate tokens for a conversation (multiple messages)
   * @param messages - Array of messages
   * @returns Estimated token count for formatted conversation
   */
  static estimateConversationTokens(messages: Message[]): number {
    if (!messages || messages.length === 0) {
      return 0;
    }

    let totalTokens = 0;

    for (const message of messages) {
      totalTokens += this.estimateMessageTokens(message);
      // Add separator overhead between messages (except last)
      if (messages.indexOf(message) < messages.length - 1) {
        totalTokens += this.MESSAGE_SEPARATOR_OVERHEAD;
      }
    }

    return totalTokens;
  }

  /**
   * Estimate tokens for full prompt including instruction text
   * @param messages - Array of messages
   * @param maxLength - Maximum summary length (for instruction)
   * @returns Estimated token count for complete prompt
   */
  static estimatePromptTokens(messages: Message[], maxLength: number = 400): number {
    const conversationTokens = this.estimateConversationTokens(messages);
    
    // Estimate instruction prompt overhead
    // "Write a brief summary of this conversation in {maxLength} words or less:\n\n"
    const instructionText = `Write a brief summary of this conversation in ${maxLength} words or less:\n\n`;
    const instructionTokens = this.estimateTokens(instructionText);
    
    return this.PROMPT_OVERHEAD + conversationTokens + instructionTokens;
  }

  /**
   * Get maximum safe input tokens
   * @returns Maximum tokens that can be safely sent
   */
  static getMaxInputTokens(): number {
    return this.MAX_INPUT_TOKENS;
  }

  /**
   * Check if estimated tokens exceed the limit
   * @param messages - Messages to check
   * @param maxLength - Maximum summary length
   * @returns True if exceeds limit
   */
  static exceedsLimit(messages: Message[], maxLength: number = 400): boolean {
    const estimatedTokens = this.estimatePromptTokens(messages, maxLength);
    return estimatedTokens > this.MAX_INPUT_TOKENS;
  }

  /**
   * Find the maximum number of messages that fit within token limit
   * @param messages - All available messages
   * @param maxLength - Maximum summary length
   * @returns Maximum number of messages that fit
   */
  static findMaxMessagesThatFit(messages: Message[], maxLength: number = 400): number {
    if (!messages || messages.length === 0) {
      return 0;
    }

    // Start from all messages and work backwards
    for (let count = messages.length; count > 0; count--) {
      const testMessages = messages.slice(-count);
      if (!this.exceedsLimit(testMessages, maxLength)) {
        return count;
      }
    }

    // Even 1 message exceeds limit - return 1 anyway (will be handled by auto-limiting)
    return 1;
  }
}
