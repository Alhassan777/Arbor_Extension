/**
 * Platform Detection
 * Detects which AI chat platform the user is currently on
 */

export function detectPlatform(): "chatgpt" | "gemini" | "perplexity" | null {
  const hostname = window.location.hostname;

  if (hostname.includes("chatgpt") || hostname.includes("openai")) {
    return "chatgpt";
  } else if (hostname.includes("gemini") || hostname.includes("google")) {
    // Check if we're actually on Gemini, not just any Google service
    if (hostname === "gemini.google.com") {
      return "gemini";
    }
  } else if (hostname.includes("perplexity")) {
    return "perplexity";
  }

  return null;
}

export function getPlatformName(
  platform: "chatgpt" | "gemini" | "perplexity"
): string {
  const names = {
    chatgpt: "ChatGPT",
    gemini: "Google Gemini",
    perplexity: "Perplexity AI",
  };
  return names[platform];
}

export function getPlatformEmoji(
  platform: "chatgpt" | "gemini" | "perplexity"
): string {
  const emojis = {
    chatgpt: "🤖",
    gemini: "✨",
    perplexity: "🔍",
  };
  return emojis[platform];
}
