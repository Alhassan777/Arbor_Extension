/**
 * Gemini Provider
 * Handles API calls to Google Gemini API
 */

import { BaseProvider, type ApiCallPayload, type ApiResponse, type ValidationResult } from "./base";
import { retryWithBackoff } from "../../utils/retry";
import { logger } from "../../utils/logger";

export class GeminiProvider extends BaseProvider {
  constructor() {
    super("gemini");
  }

  protected async executeApiCall(apiKey: string, payload: ApiCallPayload): Promise<ApiResponse> {
    const model = payload.model || this.config.defaultModel;
    const maxTokens = payload.maxTokens || 2048;

    // Build Gemini API request URL
    const url = `${this.config.apiBaseUrl}/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: payload.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    };


    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logger.error("No text in Gemini API response. Response:", data);
      throw new Error("No text in Gemini API response");
    }


    return { text };
  }

  protected async validateApiKeyWithRequest(apiKey: string): Promise<ValidationResult> {
    try {
      return await retryWithBackoff(
        async () => {
          const validationModel = this.config.validationModel || this.config.defaultModel;
          const url = `${this.config.apiBaseUrl}/models/${validationModel}:generateContent?key=${apiKey}`;

          let response: Response;
          try {
            response = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: "test",
                      },
                    ],
                  },
                ],
                generationConfig: {
                  maxOutputTokens: 1,
                },
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
                error: "API key does not have permission to access this model.",
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
