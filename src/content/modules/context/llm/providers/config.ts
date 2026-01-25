/**
 * Provider Configuration
 * Centralized configuration for all LLM providers
 * 
 * This configuration aligns with the Chrome extension manifest.json:
 * - Platform domains (chatgpt.com, gemini.google.com, claude.ai, perplexity.ai) are in content_scripts matches
 * - API endpoints (generativelanguage.googleapis.com, api.openai.com, api.anthropic.com) are in host_permissions
 * 
 * See manifest.json for the complete list of permissions and content script matches.
 */

import type { LLMProvider } from "../LLMServiceFactory";

export interface ProviderModel {
  value: string;
  label: string;
}

export interface ProviderMetadata {
  name: string;
  apiKeyUrl: string;
  helpText: string;
  info: string[];
  apiKeyPrefix: string;
  apiKeyMinLength: number;
  placeholder: string;
}

export interface ProviderConfig {
  defaultModel: string;
  apiBaseUrl: string;
  models: ProviderModel[];
  metadata: ProviderMetadata;
  validationModel?: string; // Model to use for API key validation
}

export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderConfig> = {
  gemini: {
    defaultModel: "gemini-3-flash-preview",
    apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    validationModel: "gemini-3-flash-preview",
    models: [
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview) - Latest" },
      { value: "gemini-3-pro-preview", label: "Gemini 3 Pro (Preview) - Most Intelligent" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
    metadata: {
      name: "Google Gemini",
      apiKeyUrl: "https://aistudio.google.com/app/apikey",
      helpText: "Get your API key from Google AI Studio",
      placeholder: "AIza...",
      apiKeyPrefix: "AIza",
      apiKeyMinLength: 30,
      info: [
        "Get your API key: Visit Google AI Studio to create a free API key",
        "Secure storage: Your key is encrypted and stored locally on your device",
        "Direct connection: The extension connects directly to Google's Gemini API",
        "Key restrictions: You can restrict your API key to specific domains in Google Cloud Console",
      ],
    },
  },
  openai: {
    defaultModel: "gpt-5.2",
    apiBaseUrl: "https://api.openai.com/v1",
    models: [
      { value: "gpt-5.2", label: "GPT-5.2 - Latest (Best for Coding & Agents)" },
      { value: "gpt-5.2-pro", label: "GPT-5.2 Pro - Smarter Version" },
      { value: "gpt-5.1", label: "GPT-5.1" },
      { value: "gpt-5", label: "GPT-5" },
      { value: "gpt-5-mini", label: "GPT-5 Mini - Fast & Cost-Efficient" },
      { value: "gpt-5-nano", label: "GPT-5 Nano - Fastest & Most Cost-Efficient" },
      { value: "gpt-4.1", label: "GPT-4.1 - Smartest Non-Reasoning" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo - Legacy" },
    ],
    metadata: {
      name: "OpenAI",
      apiKeyUrl: "https://platform.openai.com/api-keys",
      helpText: "Get your API key from OpenAI Platform",
      placeholder: "sk-...",
      apiKeyPrefix: "sk-",
      apiKeyMinLength: 20,
      info: [
        "Get your API key: Visit OpenAI Platform to create an API key",
        "Secure storage: Your key is encrypted and stored locally on your device",
        "Direct connection: The extension connects directly to OpenAI's API",
        "Billing: Make sure you have credits in your OpenAI account",
      ],
    },
  },
  anthropic: {
    defaultModel: "claude-sonnet-4-5-20250929",
    apiBaseUrl: "https://api.anthropic.com/v1",
    models: [
      { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5 - Most Intelligent (Nov 2025)" },
      { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 - Best Balance (Sep 2025)" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 - Fastest (Oct 2025)" },
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet - Legacy" },
    ],
    metadata: {
      name: "Anthropic (Claude)",
      apiKeyUrl: "https://console.anthropic.com/settings/keys",
      helpText: "Get your API key from Anthropic Console",
      placeholder: "sk-ant-...",
      apiKeyPrefix: "sk-ant-",
      apiKeyMinLength: 20,
      info: [
        "Get your API key: Visit Anthropic Console to create an API key",
        "Secure storage: Your key is encrypted and stored locally on your device",
        "Direct connection: The extension connects directly to Anthropic's API",
        "Billing: Make sure you have credits in your Anthropic account",
      ],
    },
  },
  none: {
    defaultModel: "",
    apiBaseUrl: "",
    models: [],
    metadata: {
      name: "None",
      apiKeyUrl: "",
      helpText: "",
      placeholder: "",
      apiKeyPrefix: "",
      apiKeyMinLength: 0,
      info: [],
    },
  },
};

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: LLMProvider): ProviderConfig {
  return PROVIDER_CONFIGS[provider];
}

/**
 * Get available models for a provider
 */
export function getProviderModels(provider: LLMProvider): ProviderModel[] {
  return PROVIDER_CONFIGS[provider]?.models || [];
}

/**
 * Get provider metadata
 */
export function getProviderMetadata(provider: LLMProvider): ProviderMetadata {
  return PROVIDER_CONFIGS[provider]?.metadata || PROVIDER_CONFIGS.none.metadata;
}
