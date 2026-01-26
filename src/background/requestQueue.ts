/**
 * Request Queue Manager
 * 
 * Manages Gemini API requests to prevent rate limiting:
 * - Processes requests sequentially with configurable delays
 * - Handles rate limit errors (429) with exponential backoff
 * - Integrates with retry logic
 */

import { retryWithBackoff, isRateLimitError } from "../utils/retry";
import { logger } from "../utils/logger";

interface QueuedRequest {
  id: string;
  action: string;
  payload: any;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private delayBetweenRequests = 100; // ms between requests
  private maxQueueSize = 50; // Maximum queue size

  /**
   * Add a request to the queue
   */
  async add<T>(action: string, payload: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Check queue size
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error("Request queue is full. Please wait and try again."));
        return;
      }

      const request: QueuedRequest = {
        id: `${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action,
        payload,
        resolve: resolve as (value: any) => void,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(request);

      // Start processing if not already processing
      if (!this.processing) {
        this.process();
      }
    });
  }

  /**
   * Process the queue sequentially
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) {
        break;
      }

      try {
        // Execute request with retry logic
        const result = await retryWithBackoff(
          () => this.executeRequest(request.action, request.payload),
          {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 30000,
            isRetryable: (error) => {
              // Retry on rate limits and network errors
              return isRateLimitError(error) || 
                     (error instanceof Error && 
                      (error.message.includes('network') || 
                       error.message.includes('timeout')));
            },
            onRetry: (attempt, error) => {
            },
          }
        );

        request.resolve(result);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }

      // Delay before processing next request (if queue not empty)
      if (this.queue.length > 0) {
        await this.sleep(this.delayBetweenRequests);
      }
    }

    this.processing = false;
  }

  /**
   * Execute a request by sending message to background handler
   */
  private async executeRequest(action: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Send message to background script handler
      chrome.runtime.sendMessage(
        {
          action: `queue-${action}`,
          payload,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error("No response from background script"));
            return;
          }

          if (response.success === false) {
            const error = new Error(response.error || "Request failed");
            (error as any).status = response.status;
            (error as any).statusCode = response.status;
            reject(error);
            return;
          }

          resolve(response);
        }
      );
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    // Reject all pending requests
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        request.reject(new Error("Request queue cleared"));
      }
    }
  }
}

// Singleton instance
let queueInstance: RequestQueue | null = null;

/**
 * Get the singleton request queue instance
 */
export function getRequestQueue(): RequestQueue {
  if (!queueInstance) {
    queueInstance = new RequestQueue();
  }
  return queueInstance;
}
