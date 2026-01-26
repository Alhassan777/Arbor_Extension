import { BasePlatform } from "./base";
import { PlatformConfig } from "./config";

export class GeminiPlatform extends BasePlatform {
  name = "gemini";

  config: PlatformConfig = {
    // URL patterns
    chatIdPattern: /\/app\/([a-f0-9]+)/,
    baseUrl: "https://gemini.google.com",
    newChatUrl: "https://gemini.google.com/app",
    chatUrlTemplate: (chatId: string) => `https://gemini.google.com/app/${chatId}`,

    // Hostname detection
    hostnamePattern: "gemini.google.com",

    // Input field selectors
    inputSelectors: [
      'rich-textarea[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
    ],
    inputType: "contenteditable",

    // Sidebar chat link selectors - Gemini uses data-test-id="conversation"
    sidebarLinkSelectors: [
      'a[data-test-id="conversation"][href*="/app/"]',
      'nav a[href*="/app/"]',
      'aside a[href*="/app/"]',
    ],
    sidebarLinkPattern: /\/app\/([a-f0-9]+)/,

    // Title detection selectors
    titleSelectors: [
      {
        selector: 'title',
      },
      {
        selector: '[data-test-id="user-message"]',
      },
      {
        selector: '[class*="user-message"]',
      },
      {
        selector: '[class*="UserMessage"]',
      },
    ],
    titleFallback: "Untitled Chat",
    pageTitleCleanup: (title: string) => title.replace(/\s*-\s*Gemini.*$/, "").trim(),

    // Message extraction selectors
    messageSelectors: {
      user: ['[data-test-id="user-message"]'],
      assistant: ['[data-test-id="model-message"]', '[data-test-id="assistant-message"]'],
      container: ['message-content', '[class*="conversation-turn"]'],
    },
    messageRoleDetector: (element) => {
      const parentClasses = element.parentElement?.className || "";
      const isUser = parentClasses.includes("user") || parentClasses.includes("User");
      const isAI = parentClasses.includes("model") || 
                   parentClasses.includes("assistant") || 
                   parentClasses.includes("gemini");
      
      if (isUser) return 'user';
      if (isAI) return 'assistant';
      return null;
    },

    // Rename support
    supportsRename: false,
  };

  /**
   * Override getAllChatsFromSidebar to properly extract Gemini chat titles
   * Gemini's sidebar links contain nested elements that pollute textContent
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

            // Extract title more carefully for Gemini
            let title = this.extractCleanTitle(link);
            
            if (!title || title.length === 0) {
              title = config.titleFallback;
            }

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

    return chats;
  }

  /**
   * Extract clean title from Gemini sidebar link
   * Gemini structure: <a data-test-id="conversation">
   *   <div class="conversation-title">
   *     <!-- comment --> Title text <div class="conversation-title-cover"></div>
   *   </div>
   * </a>
   */
  private extractCleanTitle(linkElement: Element): string {
    // Strategy 1: Look for the specific Gemini title container
    const titleContainer = linkElement.querySelector('div.conversation-title, div[class*="conversation-title"]');
    
    if (titleContainer) {
      // Clone the container to manipulate it
      const clone = titleContainer.cloneNode(true) as HTMLElement;
      
      // Remove the cover div that Gemini uses for styling
      const coverDiv = clone.querySelector('div.conversation-title-cover, div[class*="title-cover"]');
      if (coverDiv) {
        coverDiv.remove();
      }
      
      // Remove pin icon containers if any
      const pinContainer = clone.querySelector('div.pin-icon-container, div[class*="pin-icon"]');
      if (pinContainer) {
        pinContainer.remove();
      }
      
      // Get the cleaned text content
      const text = clone.textContent?.trim();
      if (text && text.length > 0 && text.length < 500) {
        // Limit to reasonable length
        return text.length > 100 ? text.substring(0, 97) + '...' : text;
      }
    }

    // Strategy 2: Look for any div with "title" in the class name
    const titleDiv = linkElement.querySelector('div[class*="title"]:not([class*="cover"]):not([class*="icon"])');
    if (titleDiv) {
      const clone = titleDiv.cloneNode(true) as HTMLElement;
      
      // Remove nested divs that might contain UI elements
      const nestedDivs = clone.querySelectorAll('div');
      nestedDivs.forEach(div => {
        const className = div.className.toString().toLowerCase();
        if (className.includes('cover') || className.includes('icon') || className.includes('badge')) {
          div.remove();
        }
      });
      
      const text = clone.textContent?.trim();
      if (text && text.length > 0 && text.length < 500) {
        return text.length > 100 ? text.substring(0, 97) + '...' : text;
      }
    }

    // Strategy 3: Fallback - use TreeWalker to get text nodes, but filter out UI elements
    const walker = document.createTreeWalker(
      linkElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const className = parent.className.toString().toLowerCase();
          
          // Skip cover divs, icons, badges, etc.
          if (
            className.includes('cover') ||
            className.includes('icon') ||
            className.includes('badge') ||
            className.includes('pin')
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          const text = node.textContent?.trim() || '';
          return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textParts: string[] = [];
    let node;
    
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        textParts.push(text);
      }
    }

    // Join all text parts and take the first substantial one
    const fullText = textParts.join(' ').trim();
    if (fullText.length > 0) {
      return fullText.length > 100 ? fullText.substring(0, 97) + '...' : fullText;
    }

    return this.config!.titleFallback;
  }

  async renameChat(chatUrl: string, newTitle: string): Promise<boolean> {
    console.warn("Gemini chat renaming not yet implemented");
    return false;
  }
}

export const geminiPlatform = new GeminiPlatform();
