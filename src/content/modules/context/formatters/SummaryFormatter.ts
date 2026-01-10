/**
 * SummaryFormatter - Brief paragraph summarizing the conversation
 * Supports both traditional text-based and AI-powered summarization
 */

import type {
  ContextFormatter,
  FormatOptions,
  Message,
} from "../ContextFormatter";
import { MessageProcessor } from "../MessageProcessor";
import type { LLMService } from "../llm/LLMService";
import { TokenEstimator } from "../llm/TokenEstimator";
import { LLMConfigManager } from "../llm/LLMConfigManager";

export interface TruncationInfo {
  truncated: boolean;
  originalCount: number;
  finalCount: number;
  reason: string;
  estimatedTokens?: number;
}

export interface FormatAsyncResult {
  context: string;
  truncationInfo: TruncationInfo;
}

export class SummaryFormatter implements ContextFormatter {
  private llmService: LLMService | null = null;

  constructor(llmService: LLMService | null = null) {
    this.llmService = llmService;
  }

  async formatAsync(
    messages: Message[],
    options: FormatOptions
  ): Promise<FormatAsyncResult> {
    const {
      parentTitle,
      selectedText,
      connectionType,
      messageCount = 6,
    } = options;

    // Filter valid messages
    const validMessages = MessageProcessor.filterValidMessages(messages);

    // Default to last 6 messages (sliding window approach)
    let messagesToSend = MessageProcessor.getRecentMessages(
      validMessages,
      messageCount
    );

    const originalCount = messagesToSend.length;
    let truncationInfo: TruncationInfo = {
      truncated: false,
      originalCount,
      finalCount: originalCount,
      reason: "",
    };

    // Estimate tokens and auto-limit if needed
    let estimatedTokens = TokenEstimator.estimatePromptTokens(
      messagesToSend,
      400
    );
    const maxTokens = TokenEstimator.getMaxInputTokens();

    if (estimatedTokens > maxTokens) {
      // Auto-limit: remove oldest messages until under limit
      const initialCount = messagesToSend.length;
      while (estimatedTokens > maxTokens && messagesToSend.length > 1) {
        messagesToSend = messagesToSend.slice(1);
        estimatedTokens = TokenEstimator.estimatePromptTokens(
          messagesToSend,
          400
        );
      }

      truncationInfo = {
        truncated: true,
        originalCount: initialCount,
        finalCount: messagesToSend.length,
        reason:
          messagesToSend.length < initialCount
            ? `Conversation exceeded context limit (${estimatedTokens} tokens). Limited to ${messagesToSend.length} messages to fit context window.`
            : "Single message is very long and may be truncated.",
        estimatedTokens,
      };

      console.warn(
        `🌳 Arbor: Auto-limited from ${initialCount} to ${messagesToSend.length} messages (${estimatedTokens} tokens)`
      );
    } else if (
      messageCount > originalCount &&
      originalCount < validMessages.length
    ) {
      // User requested more messages than available
      truncationInfo = {
        truncated: false,
        originalCount: validMessages.length,
        finalCount: originalCount,
        reason: `Requested ${messageCount} messages, but only ${originalCount} available.`,
        estimatedTokens,
      };
    } else {
      truncationInfo.estimatedTokens = estimatedTokens;
    }

    // Try to use LLM service if available
    // Dynamically get LLM service to ensure we have the latest instance
    // (in case it was initialized after this formatter was created)
    let summary: string;
    let llmService: LLMService | null = this.llmService;
    let summaryMode = "text-based"; // Track which mode was actually used

    // If we don't have an LLM service, try to get it dynamically
    if (!llmService) {
      try {
        llmService = await LLMConfigManager.getLLMService();
      } catch (error) {
        // Silently fail - will use text-based summary
      }
    }

    if (llmService) {
      try {
        const isAvailable = await llmService.isAvailable();
        if (isAvailable) {
          const serviceType = llmService.constructor.name;
          console.log(`🌳 Arbor: LLM service available (${serviceType}), generating AI summary...`);
          console.log(`🌳 Arbor: Summarizing ${messagesToSend.length} messages`);
          
          // Use custom prompt if provided, otherwise use default
          const summaryOptions: any = {
            maxLength: 400,
            style: "brief",
          };
          
          if (options.customPrompt) {
            summaryOptions.customPrompt = options.customPrompt;
          }
          
          summary = await llmService.summarize(messagesToSend, summaryOptions);
          
          summaryMode = serviceType;
          console.log(`🌳 Arbor: ✅ AI summary generated using ${serviceType}`);
          console.log(`🌳 Arbor: Summary length: ${summary.length} characters`);
        } else {
          console.log("🌳 Arbor: LLM service not available, using text-based summary");
          summary = MessageProcessor.generateBriefSummary(validMessages, 400);
        }
      } catch (error) {
        // Fallback to text-based summary on any error
        console.warn("🌳 Arbor: LLM summarization failed, falling back to text-based:", error);
        summary = MessageProcessor.generateBriefSummary(validMessages, 400);
      }
    } else {
      // Use traditional text-based summary
      console.log("🌳 Arbor: No LLM service configured, using text-based summary");
      summary = MessageProcessor.generateBriefSummary(validMessages, 400);
    }

    // Log final summary mode
    console.log(`🌳 Arbor: 📝 Final summary mode: ${summaryMode}`);

    // Build context
    let context = `This is a continuation of our previous conversation: "${parentTitle}".\n\n`;

    context += `Summary of our discussion:\n${summary}\n\n`;

    // Add selected text if any
    if (selectedText) {
      context += `I want to focus on this specific part:\n"${selectedText}"\n\n`;
    }

    // Add connection type description (use custom if provided)
    let description: string | undefined;
    
    if (connectionType === "custom" && options.customConnectionType) {
      // Use custom connection type description
      description = options.customConnectionType;
    } else {
      // Use predefined descriptions
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
      description = relationshipDescriptions[connectionType];
    }

    if (description) {
      context += `${description}\n\n`;
    }

    context += "Please continue from here.";

    return {
      context,
      truncationInfo,
    };
  }

  format(messages: Message[], options: FormatOptions): string {
    // Synchronous fallback - use text-based summary
    const { parentTitle, selectedText, connectionType } = options;

    const validMessages = MessageProcessor.filterValidMessages(messages);
    const summary = MessageProcessor.generateBriefSummary(validMessages, 400);

    // Build context
    let context = `This is a continuation of our previous conversation: "${parentTitle}".\n\n`;

    context += `Summary of our discussion:\n${summary}\n\n`;

    // Add selected text if any
    if (selectedText) {
      context += `I want to focus on this specific part:\n"${selectedText}"\n\n`;
    }

    // Add connection type description (use custom if provided)
    let description: string | undefined;
    
    if (connectionType === "custom" && options.customConnectionType) {
      // Use custom connection type description
      description = options.customConnectionType;
    } else {
      // Use predefined descriptions
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
      description = relationshipDescriptions[connectionType];
    }

    if (description) {
      context += `${description}\n\n`;
    }

    context += "Please continue from here.";

    return context;
  }
}
