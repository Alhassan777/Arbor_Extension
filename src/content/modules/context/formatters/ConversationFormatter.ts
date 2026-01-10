/**
 * ConversationFormatter - Full conversation format with proper structure
 */

import type { ContextFormatter, FormatOptions, Message } from "../ContextFormatter";
import { MessageProcessor } from "../MessageProcessor";

export class ConversationFormatter implements ContextFormatter {
  format(messages: Message[], options: FormatOptions): string {
    const {
      parentTitle,
      selectedText,
      connectionType,
      messageLength = "full",
      messageCount = 10,
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

    // Build context
    let context = `This is a continuation of our previous conversation: "${parentTitle}".\n\n`;

    context += `Previous conversation:\n\n`;

    // Format as conversation
    processedMessages.forEach((msg) => {
      const roleLabel = msg.role === "user" ? "User" : "Assistant";
      context += `${roleLabel}: ${msg.content}\n\n`;
    });

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
