/**
 * BranchContextManager - Handles branch creation with context
 *
 * This module manages the creation of branch contexts by:
 * - Extracting recent messages from the current chat
 * - Getting selected text (if any)
 * - Generating formatted context for branching using modular formatters
 * - Copying context to clipboard
 * - Opening new chat
 */

import { chatgptPlatform } from "../../platforms/chatgpt";
import type { Platform, ConnectionType } from "../../types";
import type { Message } from "./context/ContextFormatter";
import { HybridFormatter } from "./context/formatters/HybridFormatter";
import { ConversationFormatter } from "./context/formatters/ConversationFormatter";
import { SummaryFormatter } from "./context/formatters/SummaryFormatter";
import type { ContextFormatter } from "./context/ContextFormatter";
import { LLMConfigManager } from "./context/llm/LLMConfigManager";

export interface BranchContextOptions {
  parentTitle: string;
  connectionType?: ConnectionType;
  messageCount?: number;
  messageLength?: number | "full"; // 100 | 200 | 500 | 'full'
  formatType?: "hybrid" | "conversation" | "summary"; // Default: 'hybrid'
  customConnectionType?: string; // Custom connection type label if connectionType is 'custom'
  customPrompt?: string; // Custom summarization prompt (optional)
  progressCallback?: (message: string) => void; // Progress update callback
}

export class BranchContextManager {
  private platform: "chatgpt" | "gemini" | "perplexity";
  private platformInstance: Platform;
  private formatters: Map<string, ContextFormatter>;

  constructor(platform: "chatgpt" | "gemini" | "perplexity") {
    this.platform = platform;

    // Get platform instance (similar to ChatDetector pattern)
    // Currently only ChatGPT is fully implemented
    if (platform === "chatgpt") {
      this.platformInstance = chatgptPlatform;
    } else {
      // Fallback - we'll need to implement other platforms later
      this.platformInstance = chatgptPlatform;
    }

    // Initialize formatters (will be updated with LLM service if available)
    this.formatters = new Map();
    this.formatters.set("hybrid", new HybridFormatter());
    this.formatters.set("conversation", new ConversationFormatter());
    this.formatters.set("summary", new SummaryFormatter());

    // Initialize LLM service asynchronously (after a short delay to ensure DB is ready)
    // This prevents race conditions with database initialization
    setTimeout(() => {
      this.initializeLLM();
    }, 100);
  }

  /**
   * Initialize LLM service and update formatters
   * Fails silently - extension works without LLM
   */
  private async initializeLLM(): Promise<void> {
    try {
      const config = await LLMConfigManager.loadConfig();
      const llmService = await LLMConfigManager.getLLMService();

      if (llmService) {
        const serviceType = llmService.constructor.name;
        console.log(`🌳 Arbor: LLM service type: ${serviceType}`);
        console.log(`🌳 Arbor: Provider: ${config.provider}`);

        // Check actual availability (no optimistic assumptions)
        const isAvailable = await llmService.isAvailable();

        if (isAvailable) {
          // Update SummaryFormatter with LLM service
          this.formatters.set("summary", new SummaryFormatter(llmService));
          console.log(
            `🌳 Arbor: ✅ LLM service (${serviceType}) initialized and ready for AI summarization`
          );
        } else {
          // Service configured but not available - use text-based fallback
          console.log(
            `🌳 Arbor: ❌ LLM service (${serviceType}) is not available`
          );
          console.log(`🌳 Arbor: 💡 Will use text-based summary fallback`);
          console.log(
            `🌳 Arbor: 💡 Configure your Gemini API key in extension settings`
          );
        }
      } else {
        console.log(
          "🌳 Arbor: No LLM service configured, using text-based processing only"
        );
      }
    } catch (error) {
      // Silent failure - extension works fine without LLM
      console.log(
        "🌳 Arbor: LLM service availability check failed, using text-based fallback"
      );
    }
  }

  /**
   * Create branch context and copy to clipboard
   * Returns the generated context string
   */
  async createBranchContext(options: BranchContextOptions): Promise<{
    success: boolean;
    context: string;
    error?: string;
  }> {
    try {
      const {
        parentTitle,
        connectionType = "extends",
        formatType = "hybrid",
        messageLength = "full",
        messageCount = formatType === "summary" ? 6 : 10, // Default to 6 for Summary format
        customConnectionType,
        customPrompt,
        progressCallback,
      } = options;

      // Get all messages from the current chat (we'll process them in the formatter)
      if (progressCallback)
        progressCallback("Extracting messages from conversation...");
      const allMessages = this.platformInstance.extractMessages();

      // Convert to Message format
      const messages: Message[] = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Get selected text (if any)
      const selectedText = this.platformInstance.getSelectedText() || undefined;

      // Get the appropriate formatter
      const formatter =
        this.formatters.get(formatType) || this.formatters.get("hybrid")!;

      // Generate context using the formatter
      // If it's a SummaryFormatter with async support, use formatAsync with fallback
      let context: string;
      let truncationInfo: { truncated: boolean; reason: string } | null = null;

      // Ensure we're using the correct formatter for summary mode
      if (formatType === "summary" && formatter instanceof SummaryFormatter) {
        try {
          if (progressCallback)
            progressCallback("Summarizing with Gemini AI...");
          const result = await formatter.formatAsync(messages, {
            parentTitle,
            selectedText,
            connectionType,
            messageLength,
            messageCount,
            customPrompt,
          });
          context = result.context;
          truncationInfo = result.truncationInfo;
          if (progressCallback)
            progressCallback("Context generated successfully!");
        } catch (error) {
          // Fallback: try to get LLM service dynamically and retry, or use text-based
          try {
            const llmService = await LLMConfigManager.getLLMService();
            const fallbackFormatter = new SummaryFormatter(llmService);
            const result = await fallbackFormatter.formatAsync(messages, {
              parentTitle,
              selectedText,
              connectionType,
              messageLength,
              messageCount,
              customPrompt,
            });
            context = result.context;
            truncationInfo = result.truncationInfo;
          } catch (fallbackError) {
            // Final fallback: use text-based summary without LLM
            const textOnlyFormatter = new SummaryFormatter(null);
            context = textOnlyFormatter.format(messages, {
              parentTitle,
              selectedText,
              connectionType,
              messageLength,
              messageCount,
            });
          }
        }
      } else {
        // Using non-summary format (hybrid/conversation)
        context = formatter.format(messages, {
          parentTitle,
          selectedText,
          connectionType,
          messageLength,
          messageCount,
        });
      }

      // Copy to clipboard
      if (progressCallback) progressCallback("Copying to clipboard...");
      const copied = await this.platformInstance.copyToClipboard(context);

      if (!copied) {
        return {
          success: false,
          context,
          error: "Failed to copy to clipboard",
        };
      }

      return {
        success: true,
        context,
      };
    } catch (error) {
      console.error("Error creating branch context:", error);
      return {
        success: false,
        context: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Open a new chat in the current platform
   * If context is provided, it will be automatically pasted into the new chat
   */
  openNewChat(context?: string, parentNodeId?: string, parentTreeId?: string): void {
    this.platformInstance.openNewChat(context, parentNodeId, parentTreeId);
  }

  /**
   * Get currently selected text
   */
  getSelectedText(): string | null {
    return this.platformInstance.getSelectedText();
  }

  /**
   * Get recent messages from current chat
   */
  getRecentMessages(
    count: number = 10
  ): Array<{ role: "user" | "assistant"; content: string }> {
    return this.platformInstance.getRecentMessages(count);
  }
}
