// ChatGPT platform integration
import { BasePlatform } from "./base";
import { PlatformConfig } from "./config";

export class ChatGPTPlatform extends BasePlatform {
  name = "chatgpt";

  config: PlatformConfig = {
    // URL patterns
    chatIdPattern: /\/c\/([a-zA-Z0-9-]+)/,
    baseUrl: "https://chatgpt.com",
    newChatUrl: "https://chatgpt.com/",
    chatUrlTemplate: (chatId: string) => `https://chatgpt.com/c/${chatId}`,

    // Hostname detection
    hostnamePattern: /chatgpt\.com|openai\.com/,

    // Input field selectors
    inputSelectors: [
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Send a message"]',
      'textarea[id*="prompt"]',
      'textarea[role="textbox"]',
      'textarea[tabindex="0"]',
      "textarea",
    ],
    inputType: "textarea",

    // Sidebar chat link selectors
    sidebarLinkSelectors: ['nav a[href*="/c/"]'],
    sidebarLinkPattern: /\/c\/([a-zA-Z0-9-]+)/,

    // Title detection selectors
    titleSelectors: [
      {
        selector: 'nav a[aria-current="page"]',
        extractor: (el) => {
          const titleElement = el.querySelector('[class*="line-clamp"]') || el;
          return titleElement.textContent?.trim() || null;
        },
      },
      {
        selector: "title",
      },
      {
        selector: "h1",
      },
      {
        selector: '[data-message-author-role="user"] [class*="markdown"]',
      },
    ],
    titleFallback: "Untitled Chat",
    pageTitleCleanup: (title: string) =>
      title.replace(/\s*\|\s*ChatGPT.*$/, ""),

    // Message extraction selectors
    // Based on ChatGPT's actual HTML structure (as of Jan 2026):
    // User messages: <div data-message-author-role="user"><div class="user-message-bubble-color"><div class="whitespace-pre-wrap">TEXT</div></div></div>
    // Assistant messages: <div data-message-author-role="assistant"><div class="markdown prose">...</div></div>
    messageSelectors: {
      user: [
        '[data-message-author-role="user"]',  // Get the parent container with the role
      ],
      assistant: [
        '[data-message-author-role="assistant"]',  // Get the parent container with the role
      ],
    },
    messageRoleDetector: (element) => {
      // Check the element itself
      const role = element.getAttribute("data-message-author-role");
      if (role === "user" || role === "assistant") {
        return role;
      }
      
      // Check parent element
      const parent = element.closest('[data-message-author-role]');
      if (parent) {
        const parentRole = parent.getAttribute("data-message-author-role");
        if (parentRole === "user" || parentRole === "assistant") {
          return parentRole as "user" | "assistant";
        }
      }
      
      return null;
    },

    // Rename support
    supportsRename: true,
  };

  /**
   * Attempt to rename a chat in ChatGPT by triggering the native rename UI
   * This uses DOM manipulation to simulate clicking the rename button
   */
  async renameChat(chatUrl: string, newTitle: string): Promise<boolean> {
    try {
      // Extract chat ID from URL
      const match = chatUrl.match(/\/c\/([a-zA-Z0-9-]+)/);
      if (!match) {
        console.warn("Could not extract chat ID from URL:", chatUrl);
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
        console.warn("Could not find chat in sidebar:", chatId);
        return false;
      }

      // Look for a menu trigger button (usually three dots or similar)
      // ChatGPT typically has a button that opens a context menu with rename option
      const parent =
        chatLink.closest('[class*="group"]') || chatLink.parentElement;
      if (!parent) {
        console.warn("Could not find parent container for chat link");
        return false;
      }

      // Try to find the menu button (common patterns in ChatGPT UI)
      const menuButton = parent.querySelector(
        'button[aria-label*="menu"], button[aria-haspopup="menu"]',
      ) as HTMLElement;

      if (!menuButton) {
        console.warn("Could not find menu button for chat");
        return false;
      }

      // Click the menu button to open the dropdown
      menuButton.click();

      // Wait for menu to appear
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Find the rename option in the menu
      // Look for elements containing "Rename" text
      const menuItems = document.querySelectorAll(
        '[role="menuitem"], [role="option"], button, a',
      );
      let renameButton: HTMLElement | null = null;

      for (const item of Array.from(menuItems)) {
        const text = item.textContent?.toLowerCase() || "";
        if (text.includes("rename") || text.includes("edit")) {
          renameButton = item as HTMLElement;
          break;
        }
      }

      if (!renameButton) {
        console.warn("Could not find rename button in menu");
        // Close the menu if we can't find rename
        menuButton.click();
        return false;
      }

      // Click the rename button
      renameButton.click();

      // Wait for rename input to appear
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Find the input field
      const inputField = document.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;

      if (!inputField) {
        console.warn("Could not find rename input field");
        return false;
      }

      // Set the new title
      inputField.value = newTitle;

      // Trigger input event to ensure React picks up the change
      const inputEvent = new Event("input", { bubbles: true });
      inputField.dispatchEvent(inputEvent);

      // Try to submit by pressing Enter or finding a submit button
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
      });
      inputField.dispatchEvent(enterEvent);

      // Also try to find and click a submit/save button
      await new Promise((resolve) => setTimeout(resolve, 100));
      const buttons = document.querySelectorAll("button");
      for (const button of Array.from(buttons)) {
        const text = button.textContent?.toLowerCase() || "";
        if (
          text.includes("save") ||
          text.includes("confirm") ||
          button.type === "submit"
        ) {
          button.click();
          break;
        }
      }

      console.log("Rename attempt completed");
      return true;
    } catch (error) {
      console.error("Error renaming chat in ChatGPT:", error);
      return false;
    }
  }
}

export const chatgptPlatform = new ChatGPTPlatform();
