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

    // Sidebar chat link selectors
    sidebarLinkSelectors: [
      'nav a[href*="/app/"]',
      '[data-test-id="chat-list"] a',
      '[data-test-id="history-item"] a',
      'aside a[href*="/app/"]',
      '[role="navigation"] a[href*="/app/"]',
      'a[href*="/app/"]',
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

  async renameChat(chatUrl: string, newTitle: string): Promise<boolean> {
    console.warn("Gemini chat renaming not yet implemented");
    return false;
  }
}

export const geminiPlatform = new GeminiPlatform();
