/**
 * Base Provider Class
 * Abstract base class for all LLM providers with common functionality
 */

import { logger } from "../../utils/logger";
import { retryWithBackoff, isNetworkError } from "../../utils/retry";
import { RateLimiter } from "../../utils/rateLimiter";
import type { LLMProvider } from "../../content/modules/context/llm/LLMServiceFactory";
import { getProviderConfig } from "../../content/modules/context/llm/providers/config";
import { getApiKey, type ProviderType } from "../../storage/apiKeyStorage";

export interface ApiCallPayload {
  model?: string;
  prompt: string;
  maxTokens?: number;
}

export interface ApiResponse {
  text: string;
}

export interface ValidationResult {
  success: boolean;
  valid: boolean;
  error?: string;
}

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseProvider {
  protected provider: LLMProvider;
  protected rateLimiter: RateLimiter;
  protected config: ReturnType<typeof getProviderConfig>;

  constructor(provider: LLMProvider) {
    this.provider = provider;
    this.config = getProviderConfig(provider);
    this.rateLimiter = new RateLimiter({
      maxCalls: 20,
      windowMs: 60000, // 1 minute
      identifier: `${provider} API`,
    });
  }

  /**
   * Check if API key is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // BaseProvider is never instantiated with "none", so this is safe
      if (this.provider === "none") {
        return false;
      }
      const apiKey = await getApiKey(this.provider as ProviderType);
      if (!apiKey) {
        logger.debug(`${this.provider} API key not found`);
        return false;
      }

      // Validate format using config
      const metadata = this.config.metadata;
      if (!apiKey.startsWith(metadata.apiKeyPrefix) || apiKey.length < metadata.apiKeyMinLength) {
        logger.debug(`Invalid ${this.provider} API key format`);
        return false;
      }

      logger.debug(`${this.provider} API key found`);
      return true;
    } catch (error) {
      logger.error(`Error checking ${this.provider} availability:`, error);
      return false;
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(apiKey: string): Promise<ValidationResult> {
    // Format validation
    const metadata = this.config.metadata;
    if (!apiKey.startsWith(metadata.apiKeyPrefix) || apiKey.length < metadata.apiKeyMinLength) {
      return {
        success: true,
        valid: false,
        error: `Invalid API key format (must start with '${metadata.apiKeyPrefix}' and be at least ${metadata.apiKeyMinLength} characters)`,
      };
    }

    // Delegate to provider-specific validation
    return this.validateApiKeyWithRequest(apiKey);
  }

  /**
   * Make API call with retry logic and error handling
   */
  async makeApiCall(payload: ApiCallPayload): Promise<ApiResponse> {
    // BaseProvider is never instantiated with "none", so this is safe
    if (this.provider === "none") {
      throw new Error("Cannot make API call with 'none' provider");
    }
    const apiKey = await getApiKey(this.provider as ProviderType);
    if (!apiKey) {
      throw new Error(
        `${this.config.metadata.name} API key not found. Please configure it in extension settings.`
      );
    }

    // Validate format
    const metadata = this.config.metadata;
    if (!apiKey.startsWith(metadata.apiKeyPrefix) || apiKey.length < metadata.apiKeyMinLength) {
      throw new Error(`Invalid ${this.config.metadata.name} API key format`);
    }

    // Check rate limit
    if (!this.rateLimiter.attemptCall()) {
      const resetTimeSeconds = Math.ceil(this.rateLimiter.getTimeUntilReset() / 1000);
      const remainingCalls = this.rateLimiter.getRemainingCalls();
      throw new Error(
        `Rate limit exceeded. Please wait ${resetTimeSeconds} seconds before trying again. ` +
        `(${remainingCalls} calls remaining)`
      );
    }

    // Use retry logic for API call
    return retryWithBackoff(
      async () => {
        return this.executeApiCall(apiKey, payload);
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        onRetry: (attempt, error) => {
          logger.debug(`Retrying ${this.provider} API call (attempt ${attempt}):`, error);
        },
      }
    );
  }

  /**
   * Provider-specific API call implementation
   */
  protected abstract executeApiCall(apiKey: string, payload: ApiCallPayload): Promise<ApiResponse>;

  /**
   * Provider-specific API key validation
   */
  protected abstract validateApiKeyWithRequest(apiKey: string): Promise<ValidationResult>;

  /**
   * Handle HTTP errors consistently
   */
  protected handleHttpError(response: Response, errorData: any): Error {
    const errorMessage = errorData?.error?.message || response.statusText || "API error";

    let safeErrorMessage = errorMessage;
    if (response.status === 401) {
      safeErrorMessage = "Invalid API key. Please check your API key in extension settings.";
    } else if (response.status === 403) {
      safeErrorMessage = "API key does not have permission to access this model.";
    } else if (response.status === 429) {
      safeErrorMessage = "Rate limit exceeded. Please try again later.";
    } else if (response.status === 400) {
      safeErrorMessage = "Invalid request: " + safeErrorMessage;
    }

    const error = new Error(
      `${this.config.metadata.name} API error (${response.status}): ${safeErrorMessage}`
    ) as any;
    error.status = response.status;
    return error;
  }

  /**
   * Handle network errors
   */
  protected handleNetworkError(error: unknown): Error {
    if (isNetworkError(error)) {
      return new Error(
        "Network connection unavailable. Please check your internet connection."
      );
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
