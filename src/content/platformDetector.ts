/**
 * Platform Detection
 * Detects which AI chat platform the user is currently on
 */

import { PlatformFactory } from '../platforms/factory';

export function detectPlatform(): "chatgpt" | "gemini" | "claude" | "perplexity" | null {
  const activePlatform = PlatformFactory.getActivePlatform();
  if (!activePlatform) return null;
  
  return activePlatform.name as "chatgpt" | "gemini" | "claude" | "perplexity";
}

export function getPlatformName(
  platform: "chatgpt" | "gemini" | "claude" | "perplexity"
): string {
  const names = {
    chatgpt: "ChatGPT",
    gemini: "Google Gemini",
    claude: "Claude",
    perplexity: "Perplexity AI",
  };
  return names[platform];
}

export function getPlatformEmoji(
  platform: "chatgpt" | "gemini" | "claude" | "perplexity"
): string {
  const emojis = {
    chatgpt: "🤖",
    gemini: "✨",
    claude: "🧠",
    perplexity: "🔍",
  };
  return emojis[platform];
}
