/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides configurable retry logic for async operations with:
 * - Exponential backoff delays
 * - Configurable max retries
 * - Network error detection
 * - Rate limit handling (429 status codes)
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Custom function to determine if error is retryable (default: checks for network errors and 429) */
  isRetryable?: (error: any) => boolean;
  /** Called before each retry attempt */
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'isRetryable' | 'onRetry'>> & {
  isRetryable: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
} = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  isRetryable: (error: any) => {
    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    
    // Retry on rate limit errors (429)
    if (error?.status === 429 || error?.statusCode === 429) {
      return true;
    }
    
    // Retry on timeout errors
    if (error?.message?.toLowerCase().includes('timeout')) {
      return true;
    }
    
    // Retry on network connectivity issues
    if (error?.message?.toLowerCase().includes('network') || 
        error?.message?.toLowerCase().includes('connection')) {
      return true;
    }
    
    // Don't retry on authentication errors (401, 403)
    if (error?.status === 401 || error?.status === 403 || 
        error?.statusCode === 401 || error?.statusCode === 403) {
      return false;
    }
    
    // Don't retry on client errors (400)
    if (error?.status === 400 || error?.statusCode === 400) {
      return false;
    }
    
    // Retry on server errors (5xx)
    if (error?.status >= 500 || error?.statusCode >= 500) {
      return true;
    }
    
    return false;
  },
};

/**
 * Calculate delay for retry attempt using exponential backoff
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'isRetryable' | 'onRetry'>>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws Error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    isRetryable: options.isRetryable || DEFAULT_OPTIONS.isRetryable,
  };
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, throw the error
      if (attempt >= opts.maxRetries) {
        throw error;
      }
      
      // Check if error is retryable
      if (!opts.isRetryable(error)) {
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(attempt + 1, opts);
      
      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, error);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Check if error indicates network connectivity issues
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Network errors typically have these characteristics
  if (error instanceof TypeError) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }
  
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || 
           msg.includes('connection') ||
           msg.includes('timeout') ||
           msg.includes('offline');
  }
  
  return false;
}

/**
 * Check if error is a rate limit error (429)
 */
export function isRateLimitError(error: any): boolean {
  return error?.status === 429 || 
         error?.statusCode === 429 ||
         (error?.message && error.message.includes('rate limit'));
}
