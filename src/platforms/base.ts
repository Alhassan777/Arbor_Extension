import { Platform } from "../types";
import { PlatformConfig } from "./config";
import * as domUtils from "./utils/dom";
import * as reactUtils from "./utils/react";
import { debounce, findBestMatch, isElementVisible } from "./utils/dom";
import {
  setInputValue,
  setContentEditableValue,
  focusElement,
} from "./utils/react";
import { setSessionStorage } from "../utils/sessionStorage";

/**
 * Abstract base class with shared functionality for all platform adapters
 */
export abstract class BasePlatform implements Platform {
  abstract name: string;
  config?: PlatformConfig; // Optional - for future configuration-based implementation

  abstract renameChat(chatUrl: string, newTitle: string): Promise<boolean>;

  // Cleanup tracking
  protected cleanupFunctions: Array<() => void> = [];

  // Rate limiting
  protected rateLimiter: Map<
    string,
    { lastAttempt: number; attempts: number }
  > = new Map();

  // Selector caching
  protected selectorCache: Map<
    string,
    { selector: string; timestamp: number }
  > = new Map();

  // Shared implementations

  /**
   * Cleanup all observers and event listeners
   * Call this when the platform is no longer needed
   */
  cleanup(): void {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
    this.rateLimiter.clear();
    this.selectorCache.clear();
  }

  /**
   * Check if an operation should be attempted based on rate limiting
   * Prevents spam when operations repeatedly fail
   *
   * @param operationKey - Unique key for the operation
   * @param cooldownMs - Cooldown period in milliseconds (default: 5000)
   * @param maxAttempts - Maximum attempts before cooldown (default: 3)
   * @returns true if operation should be attempted
   */
  protected shouldAttempt(
    operationKey: string,
    cooldownMs: number = 5000,
    maxAttempts: number = 3,
  ): boolean {
    const now = Date.now();
    const limitInfo = this.rateLimiter.get(operationKey);

    if (!limitInfo) {
      this.rateLimiter.set(operationKey, { lastAttempt: now, attempts: 1 });
      return true;
    }

    const timeSinceLastAttempt = now - limitInfo.lastAttempt;

    // Reset if cooldown period has passed
    if (timeSinceLastAttempt > cooldownMs) {
      this.rateLimiter.set(operationKey, { lastAttempt: now, attempts: 1 });
      return true;
    }

    // Check if we've exceeded max attempts
    if (limitInfo.attempts >= maxAttempts) {
      return false;
    }

    // Increment attempts
    limitInfo.attempts++;
    limitInfo.lastAttempt = now;
    return true;
  }

  /**
   * Get the selected/highlighted text in the chat
   */
  getSelectedText(): string | null {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      return null;
    }
    return selection.toString().trim();
  }

  /**
   * Copy text to clipboard with fallback methods
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      // Method 1: Try navigator.clipboard (modern, requires focus)
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Method 2: Try focusing the window first, then retry
      try {
        window.focus();
        await new Promise(resolve => setTimeout(resolve, 100)); // Give time for focus
        await navigator.clipboard.writeText(text);
        return true;
      } catch (refocusError) {
        // Method 3: Fallback to document.execCommand (deprecated but works without focus)
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          return successful;
        } catch (execCommandError) {
          return false;
        }
      }
    }
  }

  /**
   * Get last N messages for context
   */
  getRecentMessages(
    count: number = 10,
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const allMessages = this.extractMessages();
    return allMessages.slice(-count);
  }

  /**
   * Generate context prompt for branching
   */
  generateBranchContext(params: {
    parentTitle: string;
    summary?: string;
    selectedText?: string;
    connectionType?: string;
  }): string {
    const { parentTitle, summary, selectedText, connectionType } = params;

    let context = `This is a continuation of our previous conversation: "${parentTitle}".\n\n`;

    if (summary) {
      context += `Previous conversation summary:\n${summary}\n\n`;
    }

    if (selectedText) {
      context += `I want to focus on this specific part:\n"${selectedText}"\n\n`;
    }

    if (connectionType) {
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
        context += description + "\n\n";
      }
    }

    context += "Please continue from here.";
    return context;
  }

  /**
   * Utility: Wait for element to appear in DOM
   * Returns the element if found, or null if timeout
   */
  protected async waitForElement(
    selector: string,
    timeout: number = 5000,
  ): Promise<Element | null> {
    const { element } = await domUtils.waitForElement(selector, timeout);
    return element;
  }

  /**
   * Utility: Set value on React-controlled input/textarea
   */
  protected setInputValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string,
  ): void {
    reactUtils.setInputValue(element, value);
  }

  /**
   * Utility: Set text content on contenteditable element
   * Uses textContent (not innerHTML) to prevent XSS
   */
  protected setContentEditableValue(element: HTMLElement, value: string): void {
    reactUtils.setContentEditableValue(element, value);
  }

  /**
   * @deprecated Use setInputValue() or setContentEditableValue() instead
   * This method is kept for backward compatibility
   */
  protected setReactInputValue(element: HTMLElement, value: string): void {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      this.setInputValue(element, value);
    } else if (element.getAttribute("contenteditable") === "true") {
      this.setContentEditableValue(element, value);
    } else {
      // Fallback
      reactUtils.triggerReactEvents(element);
    }
  }

  // ========== Common implementations using config ==========

  /**
   * Get config with type safety
   * Since config is abstract and must be provided by subclasses, it's always defined
   */
  protected getConfig(): PlatformConfig {
    if (!this.config) {
      throw new Error(`Platform ${this.name} must provide a config`);
    }
    return this.config;
  }

  /**
   * Check if we're on this platform
   */
  isActive(): boolean {
    const config = this.getConfig();
    const hostname = window.location.hostname;
    const pattern = config.hostnamePattern;

    if (typeof pattern === "string") {
      return hostname.includes(pattern);
    }
    return pattern.test(hostname);
  }

  /**
   * Extract chat ID from URL using config pattern
   */
  getChatId(): string | null {
    const config = this.getConfig();
    const match = window.location.pathname.match(config.chatIdPattern);
    return match ? match[1] : null;
  }

  /**
   * Get current chat URL
   */
  detectCurrentChatUrl(): string | null {
    const chatId = this.getChatId();
    if (!chatId) return null;
    return window.location.href;
  }

  /**
   * Check if we're in a conversation (not home page)
   */
  isInConversation(): boolean {
    return this.getChatId() !== null;
  }

  /**
   * Navigate to a specific chat
   */
  navigateToChat(chatId: string): void {
    const config = this.getConfig();
    window.location.href = config.chatUrlTemplate(chatId);
  }

  /**
   * Open a new chat (navigates to new chat URL)
   * If context is provided, it will be automatically pasted into the new chat
   */
  openNewChat(
    context?: string,
    parentNodeId?: string,
    parentTreeId?: string,
  ): void {
    const config = this.getConfig();
    // Store context and parent info for auto-pasting after navigation
    if (context) {
      setSessionStorage({
        arbor_branch_context: context,
        arbor_branch_parent_node_id: parentNodeId || null,
        arbor_branch_parent_tree_id: parentTreeId || null,
        arbor_branch_timestamp: Date.now().toString(),
      }).catch((error) => {
        console.error("Failed to store branch context:", error);
      });
    }
    window.location.href = config.newChatUrl;
  }

  /**
   * Watch for URL changes (SPA navigation)
   * Returns a cleanup function to stop observing
   */
  onNavigationChange(callback: (chatId: string | null) => void): () => void {
    let lastChatId = this.getChatId();

    // Debounce the callback to avoid excessive calls
    const debouncedCallback = debounce(() => {
      const currentChatId = this.getChatId();
      if (currentChatId !== lastChatId) {
        lastChatId = currentChatId;
        callback(currentChatId);
      }
    }, 100);

    // Use URL polling instead of MutationObserver (much cheaper)
    // Poll every 500ms when tab is visible
    let pollInterval: number | null = null;
    let isVisible = !document.hidden;

    const startPolling = () => {
      if (pollInterval !== null) return;

      pollInterval = window.setInterval(() => {
        if (!isVisible) return;
        debouncedCallback();
      }, 500);
    };

    const stopPolling = () => {
      if (pollInterval !== null) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Handle visibility changes to pause polling when tab hidden
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        debouncedCallback(); // Check immediately when becoming visible
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start polling
    startPolling();

    // Also listen to popstate for back/forward navigation
    const popstateHandler = () => {
      const currentChatId = this.getChatId();
      if (currentChatId !== lastChatId) {
        lastChatId = currentChatId;
        callback(currentChatId);
      }
    };
    window.addEventListener("popstate", popstateHandler);

    // Return cleanup function
    const cleanup = () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", popstateHandler);
    };

    // Store cleanup function
    this.cleanupFunctions.push(cleanup);

    return cleanup;
  }

  /**
   * Paste text into the platform's input field
   */
  async pasteIntoInput(text: string): Promise<boolean> {
    // Rate limiting to prevent spam
    if (!this.shouldAttempt("pasteIntoInput", 3000, 5)) {
      console.warn(
        `🌳 Arbor: Rate limit exceeded for pasteIntoInput on ${this.name}`,
      );
      return false;
    }

    try {
      const maxAttempts = 30;
      let attempts = 0;
      const config = this.getConfig();
      const selectors = config.inputSelectors;
      const inputType = config.inputType;
      const cacheKey = `${this.name}-input`;

      // Check selector cache first
      const cached = this.selectorCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) {
        const element = document.querySelector(cached.selector);
        if (element && this.isValidInputElement(element, inputType)) {
          await focusElement(element as HTMLElement);
          this.setInputValueByType(element as HTMLElement, text, inputType);
          console.log(
            `🌳 Arbor: Context pasted into ${this.name} input field (cached)`,
          );
          return true;
        }
      }

      while (attempts < maxAttempts) {
        const { element, selector } = findBestMatch(selectors, (el) =>
          this.isValidInputElement(el, inputType),
        );

        if (element) {
          // Cache the working selector
          this.selectorCache.set(cacheKey, {
            selector: selector!,
            timestamp: Date.now(),
          });

          await focusElement(element as HTMLElement);
          this.setInputValueByType(element as HTMLElement, text, inputType);

          return true;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }

      console.warn(
        `🌳 Arbor: Could not find ${this.name} input field to paste context`,
      );
      return false;
    } catch (error) {
      console.error(`🌳 Arbor: Error pasting into ${this.name} input:`, error);
      return false;
    }
  }

  /**
   * Get all chats from sidebar
   */
  getAllChatsFromSidebar(): Array<{ id: string; title: string; url: string }> {
    const chats: Array<{ id: string; title: string; url: string }> = [];
    const config = this.getConfig();
    const selectors = config.sidebarLinkSelectors;
    const pattern = config.sidebarLinkPattern;
    const seenIds = new Set<string>();

    for (const selector of selectors) {
      try {
        const links = document.querySelectorAll(selector);

        links.forEach((link) => {
          const href = (link as HTMLAnchorElement).href;
          const match = href.match(pattern);

          if (match) {
            const chatId = match[1];

            // Skip if we've already seen this chat
            if (seenIds.has(chatId)) return;
            seenIds.add(chatId);

            const title = link.textContent?.trim() || config.titleFallback;

            chats.push({
              id: chatId,
              title,
              url: href,
            });
          }
        });

        // If we found chats, we can stop trying other strategies
        if (chats.length > 0) {
          break;
        }
      } catch (error) {
        console.warn(
          `🌳 Arbor [${this.name}]: Error with selector "${selector}":`,
          error,
        );
      }
    }

    // No chats found - this is normal on some pages

    return chats;
  }

  /**
   * Extract chat title from DOM using config selectors
   */
  detectChatTitle(): string | null {
    const config = this.getConfig();
    const chatId = this.getChatId();

    // Try 1: Find the exact chat in the sidebar by matching href
    if (chatId) {
      for (const selector of config.sidebarLinkSelectors) {
        const sidebarLinks = document.querySelectorAll(selector);
        for (const link of Array.from(sidebarLinks)) {
          const href = (link as HTMLAnchorElement).href;
          if (href.includes(chatId)) {
            const title = link.textContent?.trim();
            if (title && title.length > 0) {
              return title.length > 100
                ? title.substring(0, 97) + "..."
                : title;
            }
          }
        }
      }
    }

    // Try 2: Use configured title selectors
    for (const titleConfig of config.titleSelectors) {
      const element = document.querySelector(titleConfig.selector);
      if (element) {
        let title: string | null = null;

        if (titleConfig.extractor) {
          title = titleConfig.extractor(element);
        } else {
          title = element.textContent?.trim() || null;
        }

        if (title) {
          // Clean up page title if needed
          if (titleConfig.selector === "title" && config.pageTitleCleanup) {
            title = config.pageTitleCleanup(title);
          }

          // Limit length
          if (title.length > 100) {
            title = title.substring(0, 97) + "...";
          }

          return title;
        }
      }
    }

    return config.titleFallback;
  }

  /**
   * Extract all messages from current chat
   */
  extractMessages(): Array<{ role: "user" | "assistant"; content: string }> {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    const platformConfig = this.getConfig();
    const config = platformConfig.messageSelectors;
    const seen = new Set<string>(); // Track seen content to avoid duplicates

    // Helper to add message if not duplicate
    const addMessage = (role: "user" | "assistant", content: string, source: string) => {
      const trimmed = content.trim();
      if (!trimmed || seen.has(trimmed)) return false;
      
      messages.push({ role, content: trimmed });
      seen.add(trimmed);
      return true;
    };

    // Try role-specific selectors first
    if (config.user && config.user.length > 0) {
      for (const selector of config.user) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((el) => {
          // Use role detector if available to verify role
          const detectedRole = platformConfig.messageRoleDetector?.(el);
          
          if (detectedRole === "user") {
            addMessage("user", el.textContent || "", selector);
          } else if (!detectedRole) {
            // If no detector or inconclusive, assume it's user since we're using user selector
            addMessage("user", el.textContent || "", selector);
          }
        });
        
        // If we found user messages with this selector, we can break
        if (messages.some(m => m.role === 'user')) {
          break;
        }
      }
    }

    if (config.assistant && config.assistant.length > 0) {
      for (const selector of config.assistant) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((el) => {
          // Use role detector if available to verify role
          const detectedRole = platformConfig.messageRoleDetector?.(el);
          
          if (detectedRole === "assistant") {
            addMessage("assistant", el.textContent || "", selector);
          } else if (!detectedRole) {
            // If no detector or inconclusive, assume it's assistant since we're using assistant selector
            addMessage("assistant", el.textContent || "", selector);
          }
        });
        
        // If we found assistant messages with this selector, we can break
        if (messages.some(m => m.role === 'assistant')) {
          break;
        }
      }
    }

    // Fallback: Use container selectors with role detector
    if (
      messages.length === 0 &&
      config.container &&
      config.container.length > 0
    ) {
      config.container.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const content = el.textContent?.trim();
          if (!content) return;

          let role: "user" | "assistant" | null = null;

          if (platformConfig.messageRoleDetector) {
            role = platformConfig.messageRoleDetector(el);
          } else {
            // Heuristic: check classes or attributes
            const classes = el.className || "";
            const isUser = classes.includes("user") || classes.includes("User");
            const isAssistant =
              classes.includes("assistant") ||
              classes.includes("Assistant") ||
              classes.includes("model") ||
              classes.includes("Model");

            if (isUser) role = "user";
            else if (isAssistant) role = "assistant";
          }

          if (role) {
            addMessage(role, content, selector);
          }
        });
      });
    }
    
    if (messages.length === 0) {
      console.error(`🌳 Arbor: ⚠️ NO MESSAGES EXTRACTED!`);
    }

    return messages;
  }

  // ========== Helper methods ==========

  /**
   * Check if element is a valid input element for the given type
   */
  private isValidInputElement(element: Element, inputType: string): boolean {
    if (inputType === "textarea") {
      return (
        element instanceof HTMLTextAreaElement &&
        !element.disabled &&
        isElementVisible(element)
      );
    } else if (inputType === "input") {
      return (
        (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement) &&
        !(element as HTMLInputElement).disabled &&
        isElementVisible(element)
      );
    } else if (inputType === "contenteditable") {
      return (
        element instanceof HTMLElement &&
        element.getAttribute("contenteditable") === "true" &&
        isElementVisible(element)
      );
    }
    return false;
  }

  /**
   * Set input value based on input type
   */
  private setInputValueByType(
    element: HTMLElement,
    value: string,
    inputType: string,
  ): void {
    if (inputType === "textarea" || inputType === "input") {
      if (
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLInputElement
      ) {
        setInputValue(element, value);
      }
    } else if (inputType === "contenteditable") {
      setContentEditableValue(element, value);
    }
  }
}
