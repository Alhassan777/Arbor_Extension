// ChatGPT platform integration
import { Platform } from '../types';

export class ChatGPTPlatform implements Platform {
  name = 'chatgpt';

  /**
   * Detect if we're on ChatGPT
   */
  isActive(): boolean {
    const hostname = window.location.hostname;
    return hostname.includes('chatgpt.com') || hostname.includes('openai.com');
  }

  /**
   * Extract chat ID from URL
   * URLs look like: https://chatgpt.com/c/abc123def456
   */
  getChatId(): string | null {
    const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
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
   * Extract chat title from DOM
   * ChatGPT displays the title in various places
   */
  detectChatTitle(): string | null {
    const chatId = this.getChatId();

    // First try: Find the exact chat in the sidebar by matching href
    if (chatId) {
      const sidebarLinks = document.querySelectorAll('nav a[href*="/c/"]');
      for (const link of Array.from(sidebarLinks)) {
        const href = (link as HTMLAnchorElement).href;
        if (href.includes(chatId)) {
          const titleElement = link.querySelector('[class*="line-clamp"]') || link;
          const title = titleElement.textContent?.trim();
          if (title && title.length > 0) {
            return title.length > 100 ? title.substring(0, 97) + '...' : title;
          }
        }
      }
    }

    // Fallback: Try multiple selectors
    const selectors = [
      // Sidebar selected item
      'nav a[aria-current="page"]',
      // Page title
      'title',
      // Header title
      'h1',
      // First message content
      '[data-message-author-role="user"] [class*="markdown"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        let title = element.textContent.trim();

        // Clean up page title (remove " | ChatGPT" suffix)
        if (selector === 'title') {
          title = title.replace(/\s*\|\s*ChatGPT.*$/, '');
        }

        // Limit length
        if (title.length > 100) {
          title = title.substring(0, 97) + '...';
        }

        return title || 'Untitled Chat';
      }
    }

    return 'Untitled Chat';
  }

  /**
   * Get all chats from ChatGPT sidebar
   * Returns array of {id, title, url}
   */
  getAllChatsFromSidebar(): Array<{ id: string; title: string; url: string }> {
    const chats: Array<{ id: string; title: string; url: string }> = [];

    // Find all chat links in sidebar
    const sidebarLinks = document.querySelectorAll('nav a[href*="/c/"]');

    sidebarLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      const match = href.match(/\/c\/([a-zA-Z0-9-]+)/);

      if (match) {
        const chatId = match[1];

        // Extract title from the link
        const titleElement = link.querySelector('[class*="line-clamp"]') || link;
        const title = titleElement.textContent?.trim() || 'Untitled Chat';

        chats.push({
          id: chatId,
          title,
          url: href,
        });
      }
    });

    return chats;
  }

  /**
   * Check if we're in a conversation (not home page)
   */
  isInConversation(): boolean {
    return this.getChatId() !== null;
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
   * Open a new chat (navigates to home then opens new chat)
   * If context is provided, it will be automatically pasted into the new chat
   */
  openNewChat(context?: string, parentNodeId?: string, parentTreeId?: string): void {
    // Store context and parent info for auto-pasting after navigation
    if (context) {
      sessionStorage.setItem('arbor_branch_context', context);
      if (parentNodeId) {
        sessionStorage.setItem('arbor_branch_parent_node_id', parentNodeId);
      }
      if (parentTreeId) {
        sessionStorage.setItem('arbor_branch_parent_tree_id', parentTreeId);
      }
      sessionStorage.setItem('arbor_branch_timestamp', Date.now().toString());
    }
    window.location.href = 'https://chatgpt.com/';
  }

  /**
   * Paste text into ChatGPT's input field
   * This method finds the textarea and programmatically inserts the text
   */
  async pasteIntoInput(text: string): Promise<boolean> {
    try {
      // Wait for the page to be ready and input field to be available
      const maxAttempts = 30;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        // Try multiple selectors for ChatGPT's input field
        // ChatGPT uses various selectors depending on the version
        const selectors = [
          'textarea[data-id="root"]', // Common ChatGPT textarea selector
          'textarea[placeholder*="Message"]', // Placeholder-based selector
          'textarea[placeholder*="message"]',
          'textarea[placeholder*="Send a message"]',
          'textarea[id*="prompt"]',
          'textarea[role="textbox"]',
          'textarea[tabindex="0"]', // Often the main input
          'textarea', // Fallback to any textarea
        ];

        let textarea: HTMLTextAreaElement | null = null;
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of Array.from(elements)) {
            if (element instanceof HTMLTextAreaElement) {
              // Check if it's visible and enabled, and likely the main input
              const rect = element.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && !element.disabled) {
                // Prefer textareas that are in the main content area
                const isMainInput = element.offsetParent !== null && 
                                  (rect.top > 0 && rect.left > 0);
                if (isMainInput) {
                  textarea = element;
                  break;
                }
              }
            }
          }
          if (textarea) break;
        }

        if (textarea) {
          // Focus the textarea first
          textarea.focus();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Get the native value setter to properly update React-controlled inputs
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;
          
          // Set the value using native setter (for React)
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(textarea, text);
          } else {
            textarea.value = text;
          }
          
          // Trigger multiple events to ensure React picks up the change
          const events = ['input', 'change', 'keydown', 'keyup'];
          for (const eventType of events) {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            textarea.dispatchEvent(event);
          }
          
          // Also try React's synthetic event system
          const reactInputEvent = new Event('input', { bubbles: true });
          Object.defineProperty(reactInputEvent, 'target', {
            value: textarea,
            enumerable: true,
          });
          textarea.dispatchEvent(reactInputEvent);
          
          // Set selection to end of text
          textarea.setSelectionRange(text.length, text.length);
          
          // Focus again to ensure it's active
          textarea.focus();

          console.log('🌳 Arbor: Context pasted into input field');
          return true;
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      console.warn('🌳 Arbor: Could not find input field to paste context');
      return false;
    } catch (error) {
      console.error('🌳 Arbor: Error pasting into input:', error);
      return false;
    }
  }

  /**
   * Navigate to a specific chat
   */
  navigateToChat(chatId: string): void {
    window.location.href = `https://chatgpt.com/c/${chatId}`;
  }

  /**
   * Generate context prompt for branching
   * This creates a prompt that the user can paste into a new chat
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
        context += description + '\n\n';
      }
    }

    context += 'Please continue from here.';

    return context;
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Watch for URL changes (ChatGPT is a SPA)
   */
  onNavigationChange(callback: (chatId: string | null) => void): void {
    let lastChatId = this.getChatId();

    // Use MutationObserver to detect URL changes in SPA
    const observer = new MutationObserver(() => {
      const currentChatId = this.getChatId();
      if (currentChatId !== lastChatId) {
        lastChatId = currentChatId;
        callback(currentChatId);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen to popstate for back/forward navigation
    window.addEventListener('popstate', () => {
      const currentChatId = this.getChatId();
      if (currentChatId !== lastChatId) {
        lastChatId = currentChatId;
        callback(currentChatId);
      }
    });
  }

  /**
   * Extract all messages from current chat (for context/summarization)
   */
  extractMessages(): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Find all message elements
    const messageElements = document.querySelectorAll('[data-message-author-role]');

    messageElements.forEach((element) => {
      const role = element.getAttribute('data-message-author-role') as
        | 'user'
        | 'assistant'
        | null;
      if (!role || (role !== 'user' && role !== 'assistant')) return;

      const contentElement = element.querySelector('[class*="markdown"]');
      if (!contentElement) return;

      const content = contentElement.textContent?.trim();
      if (!content) return;

      messages.push({ role, content });
    });

    return messages;
  }

  /**
   * Get last N messages for context
   */
  getRecentMessages(count: number = 10): Array<{ role: 'user' | 'assistant'; content: string }> {
    const allMessages = this.extractMessages();
    return allMessages.slice(-count);
  }

  /**
   * Attempt to rename a chat in ChatGPT by triggering the native rename UI
   * This uses DOM manipulation to simulate clicking the rename button
   * @param chatUrl - The URL of the chat to rename
   * @param newTitle - The new title for the chat
   * @returns Promise<boolean> - true if rename was successful, false otherwise
   */
  async renameChat(chatUrl: string, newTitle: string): Promise<boolean> {
    try {
      // Extract chat ID from URL
      const match = chatUrl.match(/\/c\/([a-zA-Z0-9-]+)/);
      if (!match) {
        console.warn('Could not extract chat ID from URL:', chatUrl);
        return false;
      }

      const chatId = match[1];

      // Find the chat in the sidebar by matching href
      const sidebarLinks = document.querySelectorAll('nav a[href*="/c/"]');
      let chatLink: HTMLElement | null = null;

      for (const link of Array.from(sidebarLinks)) {
        const href = (link as HTMLAnchorElement).href;
        if (href.includes(chatId)) {
          chatLink = link as HTMLElement;
          break;
        }
      }

      if (!chatLink) {
        console.warn('Could not find chat in sidebar:', chatId);
        return false;
      }

      // Look for a menu trigger button (usually three dots or similar)
      // ChatGPT typically has a button that opens a context menu with rename option
      const parent = chatLink.closest('[class*="group"]') || chatLink.parentElement;
      if (!parent) {
        console.warn('Could not find parent container for chat link');
        return false;
      }

      // Try to find the menu button (common patterns in ChatGPT UI)
      const menuButton = parent.querySelector('button[aria-label*="menu"], button[aria-haspopup="menu"]') as HTMLElement;

      if (!menuButton) {
        console.warn('Could not find menu button for chat');
        return false;
      }

      // Click the menu button to open the dropdown
      menuButton.click();

      // Wait for menu to appear
      await new Promise(resolve => setTimeout(resolve, 200));

      // Find the rename option in the menu
      // Look for elements containing "Rename" text
      const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], button, a');
      let renameButton: HTMLElement | null = null;

      for (const item of Array.from(menuItems)) {
        const text = item.textContent?.toLowerCase() || '';
        if (text.includes('rename') || text.includes('edit')) {
          renameButton = item as HTMLElement;
          break;
        }
      }

      if (!renameButton) {
        console.warn('Could not find rename button in menu');
        // Close the menu if we can't find rename
        menuButton.click();
        return false;
      }

      // Click the rename button
      renameButton.click();

      // Wait for rename input to appear
      await new Promise(resolve => setTimeout(resolve, 200));

      // Find the input field
      const inputField = document.querySelector('input[type="text"]') as HTMLInputElement;

      if (!inputField) {
        console.warn('Could not find rename input field');
        return false;
      }

      // Set the new title
      inputField.value = newTitle;

      // Trigger input event to ensure React picks up the change
      const inputEvent = new Event('input', { bubbles: true });
      inputField.dispatchEvent(inputEvent);

      // Try to submit by pressing Enter or finding a submit button
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
      });
      inputField.dispatchEvent(enterEvent);

      // Also try to find and click a submit/save button
      await new Promise(resolve => setTimeout(resolve, 100));
      const buttons = document.querySelectorAll('button');
      for (const button of Array.from(buttons)) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('save') || text.includes('confirm') || button.type === 'submit') {
          button.click();
          break;
        }
      }

      console.log('Rename attempt completed');
      return true;
    } catch (error) {
      console.error('Error renaming chat in ChatGPT:', error);
      return false;
    }
  }
}

export const chatgptPlatform = new ChatGPTPlatform();
