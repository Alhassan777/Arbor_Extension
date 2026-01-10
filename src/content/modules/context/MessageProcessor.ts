/**
 * MessageProcessor - Utility class for processing and formatting messages
 */

import type { Message } from "./ContextFormatter";

export class MessageProcessor {
  /**
   * Process messages with length limits
   * @param messages - Array of messages to process
   * @param lengthLimit - Maximum length per message (number) or 'full' for no limit
   * @returns Processed messages with length limits applied
   */
  static processMessages(
    messages: Message[],
    lengthLimit: number | "full" = "full"
  ): Message[] {
    if (lengthLimit === "full") {
      return messages;
    }

    return messages.map((msg) => ({
      ...msg,
      content: this.truncateMessage(msg.content, lengthLimit),
    }));
  }

  /**
   * Smart truncation: keeps first N chars and last 100 chars if message is too long
   * @param content - Message content
   * @param limit - Maximum length
   * @returns Truncated content with ellipsis
   */
  static truncateMessage(content: string, limit: number): string {
    if (content.length <= limit) {
      return content;
    }

    // If message is very long, use smart truncation
    if (content.length > limit * 2) {
      const firstPart = content.substring(0, limit - 120);
      const lastPart = content.substring(content.length - 100);
      return `${firstPart}... [truncated] ...${lastPart}`;
    }

    // Simple truncation with ellipsis
    return content.substring(0, limit - 3) + "...";
  }

  /**
   * Filter and validate messages
   * @param messages - Messages to filter
   * @returns Valid messages only
   */
  static filterValidMessages(messages: Message[]): Message[] {
    return messages.filter(
      (msg) =>
        msg &&
        msg.role &&
        (msg.role === "user" || msg.role === "assistant") &&
        msg.content &&
        msg.content.trim().length > 0
    );
  }

  /**
   * Get last N messages, ensuring we get complete conversation pairs when possible
   * @param messages - All messages
   * @param count - Number of messages to return
   * @returns Last N messages
   */
  static getRecentMessages(messages: Message[], count: number): Message[] {
    const validMessages = this.filterValidMessages(messages);
    return validMessages.slice(-count);
  }

  /**
   * Group messages into conversation pairs (user + assistant)
   * @param messages - Messages to group
   * @returns Array of message pairs
   */
  static groupIntoPairs(messages: Message[]): Array<{
    user?: Message;
    assistant?: Message;
  }> {
    const pairs: Array<{ user?: Message; assistant?: Message }> = [];
    let currentPair: { user?: Message; assistant?: Message } = {};

    for (const msg of messages) {
      if (msg.role === "user") {
        // If we have an incomplete pair, save it and start new
        if (currentPair.user || currentPair.assistant) {
          pairs.push(currentPair);
        }
        currentPair = { user: msg };
      } else if (msg.role === "assistant") {
        currentPair.assistant = msg;
        // Complete pair, save it
        pairs.push(currentPair);
        currentPair = {};
      }
    }

    // Add any remaining incomplete pair
    if (currentPair.user || currentPair.assistant) {
      pairs.push(currentPair);
    }

    return pairs;
  }

  /**
   * Generate a brief summary of conversation flow
   * @param messages - Messages to summarize
   * @param maxLength - Maximum summary length
   * @returns Brief summary text
   */
  static generateBriefSummary(
    messages: Message[],
    maxLength: number = 300
  ): string {
    const validMessages = this.filterValidMessages(messages);
    if (validMessages.length === 0) {
      return "No conversation history available.";
    }

    // Get first user message (usually the main topic/question)
    const firstUserMessage = validMessages.find((m) => m.role === "user");
    const firstAssistantMessage = validMessages.find((m) => m.role === "assistant");

    // Extract key information
    const userCount = validMessages.filter((m) => m.role === "user").length;
    const assistantCount = validMessages.filter((m) => m.role === "assistant").length;

    // Build summary based on conversation structure
    let summary = "";

    // Start with the initial topic if we have a first user message
    if (firstUserMessage) {
      const firstContent = firstUserMessage.content.trim();
      // Extract first sentence or first 150 chars
      const firstSentence = firstContent.split(/[.!?\n]/)[0] || firstContent.substring(0, 150);
      if (firstSentence.length > 15 && firstSentence.length < 200) {
        summary = `We discussed ${firstSentence.trim()}`;
        // Add period if missing
        if (!summary.endsWith(".") && !summary.endsWith("?") && !summary.endsWith("!")) {
          summary += ".";
        }
      } else {
        // If too long, summarize it
        const shortened = firstContent.substring(0, 100).trim();
        summary = `We discussed ${shortened}...`;
      }
    } else {
      summary = "We had a conversation";
    }

    // Add context about conversation flow if there are multiple exchanges
    if (userCount > 1 || assistantCount > 1) {
      const exchanges = Math.min(userCount, assistantCount);
      if (exchanges > 1) {
        summary += ` The conversation evolved through ${exchanges} exchange${exchanges !== 1 ? "s" : ""}`;
        
        // Try to capture the evolution if we have later messages
        if (validMessages.length > 4) {
          const lastUserMessage = validMessages
            .slice()
            .reverse()
            .find((m) => m.role === "user");
          if (lastUserMessage) {
            const lastContent = lastUserMessage.content.trim();
            const lastSentence = lastContent.split(/[.!?\n]/)[0] || lastContent.substring(0, 80);
            if (lastSentence.length > 15 && lastSentence.length < 150) {
              summary += `, moving from the initial topic to ${lastSentence.trim().toLowerCase()}`;
              if (!summary.endsWith(".")) summary += ".";
            }
          }
        } else {
          summary += ".";
        }
      }
    } else {
      summary += ".";
    }

    // Truncate if needed
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + "...";
    }

    return summary;
  }
}
