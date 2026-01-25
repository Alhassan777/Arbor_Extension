/**
 * Provider Configuration
 * Centralized configuration for all LLM providers
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
    defaultModel: "gemini-2.0-flash-exp",
    apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    validationModel: "gemini-2.0-flash-exp",
    models: [
      { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Experimental)" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { value: "gemini-pro", label: "Gemini Pro" },
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
    defaultModel: "gpt-4o-mini",
    apiBaseUrl: "https://api.openai.com/v1",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
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
    defaultModel: "claude-3-5-sonnet-20241022",
    apiBaseUrl: "https://api.anthropic.com/v1",
    models: [
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
      { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
      { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
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
