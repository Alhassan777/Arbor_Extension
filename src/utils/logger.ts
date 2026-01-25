/**
 * Logger Utility - Environment-aware logging
 * 
 * - Development mode: Full console logging
 * - Production mode: Errors and warnings only, no debug logs
 * - Always redacts sensitive data (API keys, etc.)
 */

// Detect build mode from environment or manifest
// webpack DefinePlugin will replace NODE_ENV at build time
// TypeScript declaration to avoid compile errors
declare const NODE_ENV: string | undefined;

const isProduction = (() => {
  try {
    // Check if we're in a browser extension context
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // In production builds, webpack DefinePlugin replaces NODE_ENV
      // Access via global scope - webpack will inject this at build time
      const nodeEnv = typeof NODE_ENV !== 'undefined' ? NODE_ENV : undefined;
      return nodeEnv === 'production';
    }
    // Fallback: assume development if we can't determine
    return false;
  } catch {
    return false;
  }
})();

/**
 * Redact API keys and other sensitive data from log messages
 * SECURITY: Enhanced with additional patterns to prevent sensitive data leakage
 */
function redactSensitiveData(message: string): string {
  if (!message || typeof message !== 'string') {
    return message;
  }
  
  // Redact Gemini API keys (AIza...)
  let redacted = message.replace(/AIza[^\s"']+/g, 'AIza...****');
  
  // Redact potential API keys in URLs (query parameters)
  redacted = redacted.replace(/[?&]key=([^&\s"']+)/gi, '?key=****');
  redacted = redacted.replace(/[?&]api_key=([^&\s"']+)/gi, '?api_key=****');
  
  // Redact Bearer tokens
  redacted = redacted.replace(/Bearer\s+[^\s"']+/gi, 'Bearer ****');
  
  // Redact Authorization headers in JSON/objects
  redacted = redacted.replace(/"Authorization":\s*"[^"]+"/gi, '"Authorization": "****"');
  redacted = redacted.replace(/'Authorization':\s*'[^']+'/gi, "'Authorization': '****'");
  
  // Redact X-API-Key headers
  redacted = redacted.replace(/"X-API-Key":\s*"[^"]+"/gi, '"X-API-Key": "****"');
  redacted = redacted.replace(/'X-API-Key':\s*'[^']+'/gi, "'X-API-Key': '****'");
  
  // Redact email addresses (PII)
  redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***');
  
  // Redact potential tokens (long alphanumeric strings that look like tokens)
  redacted = redacted.replace(/\b[A-Za-z0-9_-]{40,}\b/g, '****TOKEN****');
  
  return redacted;
}

/**
 * Format log message with prefix
 */
function formatMessage(level: string, ...args: any[]): any[] {
  const prefix = `🌳 Arbor [${level}]`;
  const formatted = args.map(arg => {
    if (typeof arg === 'string') {
      return redactSensitiveData(arg);
    }
    if (arg instanceof Error) {
      return new Error(redactSensitiveData(arg.message));
    }
    // For objects, try to redact string values
    if (typeof arg === 'object' && arg !== null) {
      try {
        const stringified = JSON.stringify(arg);
        const redacted = redactSensitiveData(stringified);
        return JSON.parse(redacted);
      } catch {
        return arg;
      }
    }
    return arg;
  });
  
  return [prefix, ...formatted];
}

/**
 * Logger interface
 */
export const logger = {
  /**
   * Debug log - only in development
   */
  debug(...args: any[]): void {
    if (!isProduction) {
      console.log(...formatMessage('DEBUG', ...args));
    }
  },
  
  /**
   * Info log - only in development
   */
  info(...args: any[]): void {
    if (!isProduction) {
      console.info(...formatMessage('INFO', ...args));
    }
  },
  
  /**
   * Warning log - always shown
   */
  warn(...args: any[]): void {
    console.warn(...formatMessage('WARN', ...args));
  },
  
  /**
   * Error log - always shown
   */
  error(...args: any[]): void {
    console.error(...formatMessage('ERROR', ...args));
  },
  
  /**
   * Log with custom level (always shown)
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', ...args: any[]): void {
    if (level === 'debug' || level === 'info') {
      if (!isProduction) {
        console[level === 'debug' ? 'log' : 'info'](...formatMessage(level.toUpperCase(), ...args));
      }
    } else {
      console[level](...formatMessage(level.toUpperCase(), ...args));
    }
  },
};
