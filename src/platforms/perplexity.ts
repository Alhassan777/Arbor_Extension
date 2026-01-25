import { BasePlatform } from "./base";
import { PlatformConfig } from "./config";

export class PerplexityPlatform extends BasePlatform {
  name = "perplexity";

  config: PlatformConfig = {
    // URL patterns
    chatIdPattern: /\/search\/([a-zA-Z0-9-_.]+)/,
    baseUrl: "https://www.perplexity.ai",
    newChatUrl: "https://www.perplexity.ai/",
    chatUrlTemplate: (chatId: string) => `https://www.perplexity.ai/search/${chatId}`,

    // Hostname detection
    hostnamePattern: "perplexity.ai",

    // Input field selectors
    inputSelectors: [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Follow-up"]',
      'input[placeholder*="Ask"]',
      "textarea",
    ],
    inputType: "input",

    // Sidebar chat link selectors
    sidebarLinkSelectors: [
      'a[href^="/search/"]',
      '[class*="ThreadItem"] a',
      '[class*="thread"] a[href*="/search/"]',
      'aside a[href*="/search/"]',
      'nav a[href*="/search/"]',
      '[role="navigation"] a[href*="/search/"]',
      'a[href*="/search/"]',
    ],
    sidebarLinkPattern: /\/search\/([a-zA-Z0-9-_.]+)/,

    // Title detection selectors
    titleSelectors: [
      {
        selector: 'title',
      },
      {
        selector: '[class*="UserMessage"]',
      },
      {
        selector: '[class*="QueryText"]',
      },
      {
        selector: '[class*="user-message"]',
      },
      {
        selector: '[data-testid*="query"]',
      },
      {
        selector: '[data-testid*="user-message"]',
      },
    ],
    titleFallback: "Untitled Search",
    pageTitleCleanup: (title: string) => title.replace(/\s*[|-]\s*Perplexity.*$/, "").trim(),

    // Message extraction selectors
    messageSelectors: {
      user: ['[class*="UserMessage"]'],
      assistant: ['[class*="AssistantMessage"]', '[class*="AnswerSection"]'],
      container: ['[class*="ConversationItem"]', '[data-testid="conversation-item"]'],
    },
    messageRoleDetector: (element) => {
      const isUser = element.className.includes("UserMessage") ||
                     element.querySelector('[class*="UserMessage"]');
      const isAssistant = element.className.includes("AssistantMessage") ||
                          element.className.includes("AnswerSection") ||
                          element.querySelector('[class*="AssistantMessage"], [class*="AnswerSection"]');
      
      if (isUser) return 'user';
      if (isAssistant) return 'assistant';
      return null;
    },

    // Rename support
    supportsRename: false,
  };

  async renameChat(chatUrl: string, newTitle: string): Promise<boolean> {
    console.warn("Perplexity chat renaming not yet implemented");
    return false;
  }
}

export const perplexityPlatform = new PerplexityPlatform();
