/**
 * Anthropic Provider
 * Handles API calls to Anthropic Messages API
 */

import { BaseProvider, type ApiCallPayload, type ApiResponse, type ValidationResult } from "./base";
import { retryWithBackoff } from "../../utils/retry";
import { logger } from "../../utils/logger";

export class AnthropicProvider extends BaseProvider {
  constructor() {
    super("anthropic");
  }

  protected async executeApiCall(apiKey: string, payload: ApiCallPayload): Promise<ApiResponse> {
    const model = payload.model || this.config.defaultModel;
    const maxTokens = payload.maxTokens || 2048;

    // Build Anthropic API request URL
    const url = `${this.config.apiBaseUrl}/messages`;

    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: payload.prompt,
        },
      ],
      max_tokens: maxTokens,
    };

    logger.debug(`Calling Anthropic API (model: ${model})`);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw this.handleNetworkError(error);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.handleHttpError(response, errorData);
    }

    const data = await response.json();

    // Extract text from Anthropic response
    // Anthropic returns content as an array of content blocks
    const textBlock = data.content?.find((block: any) => block.type === "text");
    const text = textBlock?.text;
    if (!text) {
      throw new Error("No text in Anthropic API response");
    }

    return { text };
  }

  protected async validateApiKeyWithRequest(apiKey: string): Promise<ValidationResult> {
    try {
      return await retryWithBackoff(
        async () => {
          const url = `${this.config.apiBaseUrl}/messages`;

          let response: Response;
          try {
            response = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify({
                model: this.config.defaultModel,
                messages: [
                  {
                    role: "user",
                    content: "test",
                  },
                ],
                max_tokens: 1,
              }),
            });
          } catch (error) {
            throw this.handleNetworkError(error);
          }

          if (response.ok) {
            return { success: true, valid: true };
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;

            if (response.status === 401) {
              return {
                success: true,
                valid: false,
                error: "Invalid API key. Please check your key and try again.",
              };
            } else if (response.status === 403) {
              return {
                success: true,
                valid: false,
                error: "API key does not have permission to access this resource.",
              };
            } else {
              const error = new Error(`API key validation failed: ${errorMessage}`) as any;
              error.status = response.status;
              throw error;
            }
          }
        },
        {
          maxRetries: 2,
          initialDelay: 500,
          maxDelay: 5000,
        }
      );
    } catch (error) {
      return {
        success: false,
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Network error during validation",
      };
    }
  }
}
