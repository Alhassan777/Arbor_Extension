/**
 * Provider Factory
 * Creates provider instances based on provider type
 */

import type { LLMProvider } from "../../content/modules/context/llm/LLMServiceFactory";
import { BaseProvider } from "./base";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";

const providerInstances = new Map<LLMProvider, BaseProvider>();

/**
 * Get or create a provider instance
 */
export function getProvider(provider: LLMProvider): BaseProvider | null {
  if (provider === "none") {
    return null;
  }

  if (!providerInstances.has(provider)) {
    let instance: BaseProvider;
    switch (provider) {
      case "gemini":
        instance = new GeminiProvider();
        break;
      case "openai":
        instance = new OpenAIProvider();
        break;
      case "anthropic":
        instance = new AnthropicProvider();
        break;
      default:
        return null;
    }
    providerInstances.set(provider, instance);
  }

  return providerInstances.get(provider)!;
}
