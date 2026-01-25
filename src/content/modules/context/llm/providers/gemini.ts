/**
 * GeminiLLMService - Implementation using Google Gemini
 * Uses the Gemini API via background script for secure API key handling
 */

import type { BaseLLMConfig } from "./base";
import { BaseLLMService } from "./base";

export interface GeminiLLMConfig extends BaseLLMConfig {}

export class GeminiLLMService extends BaseLLMService {
  constructor(config: GeminiLLMConfig = {}) {
    super("gemini", config);
  }
}
