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

import { PlatformFactory } from "../../platforms/factory";
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
  private platform: "chatgpt" | "gemini" | "claude" | "perplexity";
  private platformInstance: Platform;
  private formatters: Map<string, ContextFormatter>;
  private worker: Worker | null = null;

  constructor(platform: "chatgpt" | "gemini" | "claude" | "perplexity") {
    this.platform = platform;

    // Get platform instance using factory
    const platformAdapter = PlatformFactory.getPlatformByName(platform);
    if (!platformAdapter) {
      throw new Error(`Platform ${platform} not supported`);
    }
    this.platformInstance = platformAdapter;

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

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(chrome.runtime.getURL('summarization.worker.js'));
    }
    return this.worker;
  }

  private async processWithWorker(
    messages: Message[],
    options: any
  ): Promise<string> {
    const worker = this.getWorker();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker processing timeout after 30s'));
      }, 30000);
      
      worker.onmessage = (e: MessageEvent) => {
        clearTimeout(timeout);
        const response = e.data as { success: boolean; summary?: string; error?: string };
        if (response.success && response.summary) {
          resolve(response.summary);
        } else {
          reject(new Error(response.error || 'Worker processing failed'));
        }
      };
      
      worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
      
      const request = { messages, options };
      worker.postMessage(request);
    });
  }

  public cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
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

      // Get all messages from the current chat with memory limits
      if (progressCallback)
        progressCallback("Extracting messages from conversation...");
      
      // Stream message processing with memory limits
      const allMessages = this.platformInstance.extractMessages();
      
      // Memory limit: 100MB worth of text (rough estimate: ~100 chars per KB)
      const MAX_MEMORY_BYTES = 100 * 1024 * 1024;
      const ESTIMATED_CHARS_PER_BYTE = 2; // UTF-16 uses 2 bytes per char
      const MAX_CHARS = MAX_MEMORY_BYTES / ESTIMATED_CHARS_PER_BYTE;
      
      let totalChars = 0;
      let truncated = false;
      
      // Convert to Message format with progressive filtering
      const messages: Message[] = [];
      
      for (const msg of allMessages) {
        const msgLength = msg.content.length;
        
        // Check if adding this message would exceed memory limit
        if (totalChars + msgLength > MAX_CHARS) {
          console.warn(`🌳 Arbor: Memory limit reached, truncating messages at ${messages.length} messages`);
          truncated = true;
          break;
        }
        
        messages.push({
          role: msg.role,
          content: msg.content,
        });
        
        totalChars += msgLength;
        
        // Early exit if we have enough messages for the requested format
        if (messages.length >= (messageCount || 100)) {
          break;
        }
      }
      
      if (truncated && progressCallback) {
        progressCallback(`Processing ${messages.length} messages (memory limit reached)...`);
      }

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
        // Use Web Worker for heavy text processing to prevent UI freezing
        try {
          if (progressCallback) progressCallback("Processing conversation...");
          
          context = await this.processWithWorker(messages, {
            parentTitle,
            selectedText,
            connectionType,
            messageLength,
            messageCount,
          });
        } catch (workerError) {
          // Fallback to main thread if worker fails
          console.warn('Worker processing failed, using main thread:', workerError);
          context = formatter.format(messages, {
            parentTitle,
            selectedText,
            connectionType,
            messageLength,
            messageCount,
          });
        }
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
