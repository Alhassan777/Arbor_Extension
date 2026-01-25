import { BasePlatform } from './base';
import { PlatformConfig } from './config';

export class ClaudePlatform extends BasePlatform {
  name = 'claude';

  config: PlatformConfig = {
    // URL patterns
    chatIdPattern: /\/chat\/([a-f0-9-]+)/,
    baseUrl: 'https://claude.ai',
    newChatUrl: 'https://claude.ai/new',
    chatUrlTemplate: (chatId: string) => `https://claude.ai/chat/${chatId}`,

    // Hostname detection
    hostnamePattern: 'claude.ai',

    // Input field selectors
    inputSelectors: [
      'div[contenteditable="true"][placeholder*="Talk"]',
      'div[contenteditable="true"][placeholder*="Reply"]',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"]',
    ],
    inputType: 'contenteditable',

    // Sidebar chat link selectors
    sidebarLinkSelectors: ['nav a[href^="/chat/"]'],
    sidebarLinkPattern: /\/chat\/([a-f0-9-]+)/,

    // Title detection selectors
    titleSelectors: [
      {
        selector: 'title',
      },
      {
        selector: '.font-user-message, [data-is-author-user="true"]',
      },
    ],
    titleFallback: 'Untitled Chat',
    pageTitleCleanup: (title: string) => title.replace(/\s*[|•]\s*Claude.*$/, '').trim(),

    // Message extraction selectors
    messageSelectors: {
      user: ['[data-test-id="message"][data-is-author-user="true"]', '[class*="font-user-message"]'],
      assistant: ['[class*="font-claude-message"]'],
      container: ['[data-test-id="message"]'],
    },
    messageRoleDetector: (element) => {
      const isUser = element.getAttribute('data-is-author-user') === 'true' || 
                     element.className.includes('user-message');
      return isUser ? 'user' : 'assistant';
    },

    // Rename support
    supportsRename: false,
  };

  async renameChat(chatUrl: string, newTitle: string): Promise<boolean> {
    console.warn('Claude chat renaming not yet implemented');
    return false;
  }
}

export const claudePlatform = new ClaudePlatform();
