/**
 * AnthropicLLMService - Implementation using Anthropic Claude
 * Uses the Anthropic API via background script for secure API key handling
 */

import type { BaseLLMConfig } from "./base";
import { BaseLLMService } from "./base";

export interface AnthropicLLMConfig extends BaseLLMConfig {}

export class AnthropicLLMService extends BaseLLMService {
  constructor(config: AnthropicLLMConfig = {}) {
    super("anthropic", config);
  }
}
