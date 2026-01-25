import { PlatformFactory } from "../../platforms/factory";
import { Platform } from "../../types";

export interface AvailableChat {
  id: string;
  title: string;
  url: string;
  platform: "chatgpt" | "gemini" | "claude" | "perplexity";
}

export class ChatDetector {
  private platform: "chatgpt" | "gemini" | "claude" | "perplexity";
  private platformAdapter: Platform | null;

  constructor(platform: "chatgpt" | "gemini" | "claude" | "perplexity") {
    this.platform = platform;
    this.platformAdapter = PlatformFactory.getPlatformByName(platform);
  }

  async scanAvailableChats(): Promise<AvailableChat[]> {
    try {
      console.log(
        `🌳 Arbor [ChatDetector]: Scanning for ${this.platform} chats...`,
      );

      if (!this.platformAdapter) {
        console.warn(
          `🌳 Arbor [ChatDetector]: No platform adapter found for ${this.platform}`,
        );
        return [];
      }

      const chats = this.platformAdapter.getAllChatsFromSidebar();
      console.log(
        `🌳 Arbor [ChatDetector]: Found ${chats.length} chats for ${this.platform}`,
      );

      return chats.map((chat: { id: string; title: string; url: string }) => ({
        ...chat,
        platform: this.platform,
      }));
    } catch (error) {
      console.error(
        `🌳 Arbor [ChatDetector]: Error scanning ${this.platform} chats:`,
        error,
      );
      return [];
    }
  }

  detectCurrentChat(): { url: string; title: string } | null {
    if (!this.platformAdapter) return null;

    const url = this.platformAdapter.detectCurrentChatUrl();
    const title = this.platformAdapter.detectChatTitle();

    if (!url || !title) return null;

    return { url, title };
  }

  isOnChatPage(): boolean {
    if (!this.platformAdapter) return false;
    return this.platformAdapter.isInConversation();
  }
}
