/**
 * OpenAILLMService - Implementation using OpenAI
 * Uses the OpenAI API via background script for secure API key handling
 */

import type { BaseLLMConfig } from "./base";
import { BaseLLMService } from "./base";

export interface OpenAILLMConfig extends BaseLLMConfig {}

export class OpenAILLMService extends BaseLLMService {
  constructor(config: OpenAILLMConfig = {}) {
    super("openai", config);
  }
}
