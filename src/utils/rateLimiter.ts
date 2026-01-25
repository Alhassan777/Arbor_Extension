/**
 * Rate Limiter for API calls
 * SECURITY: Prevents quota exhaustion and abuse by limiting API call frequency
 */

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
  identifier?: string;
}

export class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;
  private identifier: string;

  /**
   * Create a new rate limiter
   * @param config - Configuration object
   * @param config.maxCalls - Maximum number of calls allowed in the time window (default: 10)
   * @param config.windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
   * @param config.identifier - Optional identifier for logging purposes
   */
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.maxCalls = config.maxCalls || 10;
    this.windowMs = config.windowMs || 60000; // 1 minute default
    this.identifier = config.identifier || 'default';
  }

  /**
   * Check if a call can be made without exceeding the rate limit
   * @returns true if the call is allowed, false if rate limit is exceeded
   */
  canMakeCall(): boolean {
    const now = Date.now();
    
    // Remove calls outside the current time window
    this.calls = this.calls.filter(timestamp => now - timestamp < this.windowMs);
    
    return this.calls.length < this.maxCalls;
  }

  /**
   * Record a call attempt
   * Should be called after checking canMakeCall() returns true
   */
  recordCall(): void {
    this.calls.push(Date.now());
  }

  /**
   * Attempt to make a call with rate limiting
   * @returns true if the call is allowed, false if rate limit is exceeded
   */
  attemptCall(): boolean {
    if (this.canMakeCall()) {
      this.recordCall();
      return true;
    }
    return false;
  }

  /**
   * Get the time until the next call is allowed (in milliseconds)
   * @returns milliseconds until rate limit resets, or 0 if calls can be made now
   */
  getTimeUntilReset(): number {
    if (this.canMakeCall()) {
      return 0;
    }

    const now = Date.now();
    const oldestCall = this.calls[0];
    const resetTime = oldestCall + this.windowMs;
    return Math.max(0, resetTime - now);
  }

  /**
   * Get remaining calls in the current window
   * @returns number of calls remaining before hitting the rate limit
   */
  getRemainingCalls(): number {
    const now = Date.now();
    this.calls = this.calls.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxCalls - this.calls.length);
  }

  /**
   * Reset the rate limiter (clear all recorded calls)
   */
  reset(): void {
    this.calls = [];
  }
}

/**
 * Create a rate-limited version of an async function
 * @param fn - The async function to rate limit
 * @param config - Rate limiter configuration
 * @returns A rate-limited version of the function that throws an error when rate limit is exceeded
 */
export function createRateLimitedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RateLimitConfig> = {}
): T {
  const limiter = new RateLimiter(config);

  return (async (...args: any[]) => {
    if (!limiter.attemptCall()) {
      const resetTimeSeconds = Math.ceil(limiter.getTimeUntilReset() / 1000);
      throw new Error(
        `Rate limit exceeded for ${config.identifier || 'this operation'}. ` +
        `Please wait ${resetTimeSeconds} seconds before trying again.`
      );
    }

    return await fn(...args);
  }) as T;
}
