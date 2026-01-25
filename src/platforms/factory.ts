import { Platform } from "../types";
import { chatgptPlatform } from "./chatgpt";
import { geminiPlatform } from "./gemini";
import { claudePlatform } from "./claude";
import { perplexityPlatform } from "./perplexity";

/**
 * Platform factory - returns the active platform adapter
 */
export class PlatformFactory {
  private static platforms: Platform[] = [
    chatgptPlatform,
    geminiPlatform,
    claudePlatform,
    perplexityPlatform,
  ];

  /**
   * Get the currently active platform
   */
  static getActivePlatform(): Platform | null {
    console.log(
      `🌳 Arbor [Factory]: Checking ${this.platforms.length} registered platforms...`,
    );

    for (const platform of this.platforms) {
      const isActive = platform.isActive();
      console.log(
        `🌳 Arbor [Factory]: Platform "${platform.name}" isActive: ${isActive}`,
      );

      if (isActive) {
        console.log(
          `🌳 Arbor [Factory]: ✅ Active platform found: ${platform.name}`,
        );
        return platform;
      }
    }

    console.warn("🌳 Arbor [Factory]: ❌ No active platform found");
    return null;
  }

  /**
   * Get platform by name
   */
  static getPlatformByName(
    name: "chatgpt" | "gemini" | "claude" | "perplexity",
  ): Platform | null {
    return this.platforms.find((p) => p.name === name) || null;
  }

  /**
   * Get all registered platforms
   */
  static getAllPlatforms(): Platform[] {
    return this.platforms;
  }
}
