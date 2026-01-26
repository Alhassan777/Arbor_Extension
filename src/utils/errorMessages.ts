/**
 * User-Friendly Error Message Utility
 * 
 * Converts technical errors into user-friendly messages with suggestions
 */

export interface ErrorDetails {
  message: string;
  suggestion?: string;
  action?: string;
}

/**
 * Get user-friendly error message from various error types
 */
export function getUserFriendlyError(error: any): ErrorDetails {
  if (!error) {
    return {
      message: 'An unknown error occurred',
      suggestion: 'Please try again or reload the page',
    };
  }
  
  // Handle Error objects
  const errorMessage: string = error?.message || String(error) || 'Unknown error';
  const statusCode = error?.status || error?.statusCode || error?.code;
  
  // Network errors
  if (isNetworkError(error)) {
    return {
      message: 'Network connection error',
      suggestion: 'Please check your internet connection and try again',
      action: 'Check your internet connection',
    };
  }
  
  // Rate limit errors
  if (isRateLimitError(error)) {
    return {
      message: 'Too many requests',
      suggestion: 'The API rate limit has been exceeded. Please wait a moment before trying again.',
      action: 'Wait a few seconds and try again',
    };
  }
  
  // Authentication errors
  if (statusCode === 401 || statusCode === 403) {
    return {
      message: 'Authentication failed',
      suggestion: 'Your API key may be invalid or expired. Please check your API key in extension settings.',
      action: 'Go to extension settings to update your API key',
    };
  }
  
  // Bad request errors
  if (statusCode === 400) {
    return {
      message: 'Invalid request',
      suggestion: 'The request was malformed. This may be due to invalid input or API changes.',
      action: 'Try with a different conversation or check for updates',
    };
  }
  
  // Server errors
  if (statusCode >= 500) {
    return {
      message: 'Server error',
      suggestion: 'The API server is experiencing issues. Please try again in a few moments.',
      action: 'Try again in a few moments',
    };
  }
  
  // Timeout errors
  if (errorMessage.toLowerCase().includes('timeout') || statusCode === 504) {
    return {
      message: 'Request timed out',
      suggestion: 'The request took too long to complete. This may be due to a slow connection or server issues.',
      action: 'Check your connection and try again',
    };
  }
  
  // API key specific errors
  if (errorMessage.toLowerCase().includes('api key') || 
      errorMessage.toLowerCase().includes('api_key') ||
      errorMessage.toLowerCase().includes('invalid key')) {
    return {
      message: 'Invalid API key',
      suggestion: 'Your Gemini API key is invalid or missing. Please add a valid API key in extension settings.',
      action: 'Go to extension settings to add or update your API key',
    };
  }
  
  // No API key error
  if (errorMessage.toLowerCase().includes('no api key') ||
      errorMessage.toLowerCase().includes('missing api key')) {
    return {
      message: 'API key not configured',
      suggestion: 'You need to add a Gemini API key to use summarization features. Get one from Google AI Studio.',
      action: 'Go to extension settings to add your API key',
    };
  }
  
  // Extension context errors
  if (errorMessage.toLowerCase().includes('extension context') ||
      errorMessage.toLowerCase().includes('runtime')) {
    return {
      message: 'Extension error',
      suggestion: 'The extension context is not available. Please reload the page.',
      action: 'Reload the page',
    };
  }
  
  // Default fallback
  return {
    message: 'An error occurred',
    suggestion: errorMessage || 'Please try again or check the console for details',
    action: 'Try again',
  };
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  if (error instanceof TypeError) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }
  
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || 
           msg.includes('connection') ||
           msg.includes('offline') ||
           msg.includes('failed to fetch');
  }
  
  // Check status codes
  const statusCode = error?.status || error?.statusCode;
  if (statusCode === 0 || statusCode === 'ECONNREFUSED') {
    return true;
  }
  
  return false;
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: any): boolean {
  const statusCode = error?.status || error?.statusCode;
  if (statusCode === 429) return true;
  
  const message = (error?.message || String(error)).toLowerCase();
  return message.includes('rate limit') || 
         message.includes('too many requests') ||
         message.includes('quota exceeded');
}

/**
 * Format error for display in UI
 */
export function formatErrorForUI(error: any): string {
  const friendly = getUserFriendlyError(error);
  if (friendly.suggestion) {
    return `${friendly.message}. ${friendly.suggestion}`;
  }
  return friendly.message;
}
