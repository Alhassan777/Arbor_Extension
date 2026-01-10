import { chatgptPlatform } from "../../platforms/chatgpt";

export interface AvailableChat {
  id: string;
  title: string;
  url: string;
  platform: "chatgpt" | "gemini" | "perplexity";
}

export class ChatDetector {
  private platform: "chatgpt" | "gemini" | "perplexity";

  constructor(platform: "chatgpt" | "gemini" | "perplexity") {
    this.platform = platform;
  }

  async scanAvailableChats(): Promise<AvailableChat[]> {
    try {
      // Currently only ChatGPT is implemented
      if (this.platform === "chatgpt") {
        const chats = chatgptPlatform.getAllChatsFromSidebar();
        return chats.map(
          (chat: { id: string; title: string; url: string }) => ({
            ...chat,
            platform: this.platform as "chatgpt",
          })
        );
      }

      return [];
    } catch (error) {
      console.error("Error scanning chats:", error);
      return [];
    }
  }

  detectCurrentChat(): { url: string; title: string } | null {
    const url = window.location.href;

    if (this.platform === "chatgpt") {
      // Check if we're on a chat page
      const chatIdMatch = url.match(/\/c\/([a-zA-Z0-9-]+)/);
      if (!chatIdMatch) return null;

      // Try to get title from page
      const titleEl =
        document.querySelector("h1") ||
        document.querySelector('[class*="title"]');
      const title = titleEl?.textContent?.trim() || "Untitled Chat";

      return { url, title };
    }

    return null;
  }

  isOnChatPage(): boolean {
    const url = window.location.href;

    if (this.platform === "chatgpt") {
      return /\/c\/[a-zA-Z0-9-]+/.test(url);
    }

    return false;
  }
}
