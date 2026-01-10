/**
 * HybridFormatter - Combines brief summary with last few full message pairs
 */

import type { ContextFormatter, FormatOptions, Message } from "../ContextFormatter";
import { MessageProcessor } from "../MessageProcessor";

export class HybridFormatter implements ContextFormatter {
  format(messages: Message[], options: FormatOptions): string {
    const {
      parentTitle,
      selectedText,
      connectionType,
      messageLength = "full",
      messageCount = 6, // Default to last 6 messages (3 pairs)
    } = options;

    // Process messages
    const validMessages = MessageProcessor.filterValidMessages(messages);
    const recentMessages = MessageProcessor.getRecentMessages(
      validMessages,
      messageCount
    );
    const processedMessages = MessageProcessor.processMessages(
      recentMessages,
      messageLength
    );

    // Generate brief summary from all messages (not just recent)
    const summary = MessageProcessor.generateBriefSummary(validMessages, 250);

    // Group into pairs for better readability
    const pairs = MessageProcessor.groupIntoPairs(processedMessages);
    const lastPairs = pairs.slice(-3); // Last 3 pairs

    // Build context
    let context = `This is a continuation of our previous conversation: "${parentTitle}".\n\n`;

    // Add brief summary
    context += `Brief summary:\n${summary}\n\n`;

    // Add recent conversation pairs
    if (lastPairs.length > 0) {
      context += `Recent conversation (last ${lastPairs.length} message pair${lastPairs.length !== 1 ? "s" : ""}):\n\n`;

      lastPairs.forEach((pair, index) => {
        if (pair.user) {
          context += `User: ${pair.user.content}\n\n`;
        }
        if (pair.assistant) {
          context += `Assistant: ${pair.assistant.content}\n\n`;
        }
        // Add separator between pairs (except last)
        if (index < lastPairs.length - 1) {
          context += "---\n\n";
        }
      });
    } else if (processedMessages.length > 0) {
      // Fallback: if no pairs, just show messages
      context += `Recent conversation:\n\n`;
      processedMessages.forEach((msg) => {
        const roleLabel = msg.role === "user" ? "User" : "Assistant";
        context += `${roleLabel}: ${msg.content}\n\n`;
      });
    }

    // Add selected text if any
    if (selectedText) {
      context += `I want to focus on this specific part:\n"${selectedText}"\n\n`;
    }

    // Add connection type description
    const relationshipDescriptions: Record<string, string> = {
      deepens: "Let's explore this topic in more depth.",
      explores: "Let's explore a related aspect of this.",
      contrasts: "Let's consider an alternative perspective on this.",
      examples: "Let's look at specific examples of this.",
      applies: "Let's discuss how to apply this in practice.",
      questions: "I have some questions about this.",
      extends: "Let's extend this discussion to related areas.",
      summarizes: "Let's summarize and consolidate what we've discussed.",
    };

    const description = relationshipDescriptions[connectionType];
    if (description) {
      context += `${description}\n\n`;
    }

    context += "Please continue from here.";

    return context;
  }
}
