/**
 * API Key Storage Utility
 * 
 * Stores API keys for multiple LLM providers securely using chrome.storage.local
 * - Keys are encrypted using Web Crypto API (AES-GCM) before storage
 * - Encryption key is derived from extension ID
 * - Keys are never logged in full - always redacted for security
 */

import { logger } from "../utils/logger";

const STORAGE_KEY_PREFIX = "llm_api_key_";
const ENCRYPTION_MARKER = "__encrypted__";

// Web Crypto API algorithm
const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

export type ProviderType = "gemini" | "openai" | "anthropic";

/**
 * Redact API key for safe logging
 */
function redactApiKey(key: string | null | undefined, provider: ProviderType): string {
  if (!key) return "[no key]";
  if (key.length <= 10) return "[invalid]";
  
  // Different providers have different prefixes
  const prefixLength = provider === "gemini" ? 7 : provider === "openai" ? 7 : 8;
  return `${key.substring(0, prefixLength)}...****`;
}

/**
 * Storage key for the master encryption key
 */
const MASTER_KEY_STORAGE = "arbor_master_encryption_key";

/**
 * Generate or retrieve unique per-installation encryption key
 */
async function getMasterEncryptionKey(): Promise<CryptoKey> {
  try {
    const stored = await new Promise<any>((resolve) => {
      chrome.storage.local.get([MASTER_KEY_STORAGE], (result) => {
        resolve(result[MASTER_KEY_STORAGE]);
      });
    });

    if (stored?.keyData) {
      const keyBytes = Uint8Array.from(atob(stored.keyData), c => c.charCodeAt(0));
      return await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
      );
    }

    const key = await crypto.subtle.generateKey(
      { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
      true,
      ["encrypt", "decrypt"]
    );

    const exported = await crypto.subtle.exportKey("raw", key);
    const keyData = btoa(String.fromCharCode(...new Uint8Array(exported)));
    
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [MASTER_KEY_STORAGE]: { keyData } }, () => {
        resolve();
      });
    });

    return key;
  } catch (error) {
    throw new Error(`Failed to get master encryption key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Encrypt API key using AES-GCM
 */
async function encryptApiKey(apiKey: string): Promise<{ encrypted: string; iv: string }> {
  try {
    const key = await getMasterEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      new TextEncoder().encode(apiKey)
    );
    
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    
    return {
      encrypted: encryptedBase64,
      iv: ivBase64,
    };
  } catch (error) {
    throw new Error(`Failed to encrypt API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Decrypt API key using AES-GCM
 */
async function decryptApiKey(encryptedData: string, ivData: string): Promise<string> {
  try {
    const key = await getMasterEncryptionKey();
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivData), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error(`Failed to decrypt API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if stored value is encrypted
 */
function isEncrypted(value: any): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return value.marker === ENCRYPTION_MARKER && 
         typeof value.encrypted === "string" && 
         typeof value.iv === "string";
}

/**
 * Get storage key for a provider
 */
function getStorageKey(provider: ProviderType): string {
  return `${STORAGE_KEY_PREFIX}${provider}`;
}

/**
 * Validate API key format for a provider
 */
export function validateApiKeyFormat(key: string, provider: ProviderType): { valid: boolean; error?: string } {
  if (!key || typeof key !== "string") {
    return { valid: false, error: "API key is required" };
  }

  const trimmed = key.trim();

  if (trimmed.length > 200) {
    return { valid: false, error: "API key is too long (maximum 200 characters)" };
  }

  if (trimmed.length < 20) {
    return { valid: false, error: "API key is too short (minimum 20 characters)" };
  }

  // Provider-specific validation
  if (provider === "gemini") {
    if (!trimmed.startsWith("AIza")) {
      return { valid: false, error: "Invalid Gemini API key format (must start with 'AIza')" };
    }
  } else if (provider === "openai") {
    if (!trimmed.startsWith("sk-")) {
      return { valid: false, error: "Invalid OpenAI API key format (must start with 'sk-')" };
    }
  } else if (provider === "anthropic") {
    if (!trimmed.startsWith("sk-ant-")) {
      return { valid: false, error: "Invalid Anthropic API key format (must start with 'sk-ant-')" };
    }
  }
  
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: "API key contains invalid characters (only alphanumeric, hyphens, and underscores allowed)" };
  }

  return { valid: true };
}

/**
 * Get the stored API key for a provider (decrypts if encrypted)
 */
export async function getApiKey(provider: ProviderType): Promise<string | null> {
  try {
    return new Promise(async (resolve, reject) => {
      const storageKey = getStorageKey(provider);
      chrome.storage.local.get([storageKey], async (result) => {
        if (chrome.runtime.lastError) {
          logger.error(`Error getting ${provider} API key:`, chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const stored = result[storageKey];
        
        if (!stored) {
          logger.debug(`No ${provider} API key found in storage`);
          resolve(null);
          return;
        }

        try {
          if (isEncrypted(stored)) {
            const apiKey = await decryptApiKey(stored.encrypted, stored.iv);
            logger.debug(`${provider} API key retrieved from storage`);
            resolve(apiKey);
          } else {
            logger.error(`Invalid ${provider} API key format in storage`);
            resolve(null);
          }
        } catch (decryptError) {
          logger.error(`Failed to decrypt ${provider} API key`, decryptError);
          reject(new Error(`Failed to decrypt stored ${provider} API key. Please re-enter your API key.`));
        }
      });
    });
  } catch (error) {
    logger.error(`Failed to get ${provider} API key:`, error);
    return null;
  }
}

/**
 * Store an API key securely for a provider (encrypts before storage)
 */
export async function setApiKey(apiKey: string, provider: ProviderType): Promise<{ success: boolean; error?: string }> {
  const validation = validateApiKeyFormat(apiKey, provider);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const trimmed = apiKey.trim();

  try {
    const encrypted = await encryptApiKey(trimmed);
    const storageKey = getStorageKey(provider);
    
    const storageValue = {
      marker: ENCRYPTION_MARKER,
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
    };

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [storageKey]: storageValue }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          logger.error(`Error saving ${provider} API key:`, error);
          reject(new Error(error));
          return;
        }

        logger.debug(`${provider} API key encrypted and saved to secure storage`);
        resolve({ success: true });
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to save ${provider} API key:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove the stored API key for a provider
 */
export async function removeApiKey(provider: ProviderType): Promise<{ success: boolean; error?: string }> {
  try {
    const storageKey = getStorageKey(provider);
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([storageKey], () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          logger.error(`Error removing ${provider} API key:`, error);
          reject(new Error(error));
          return;
        }

        logger.debug(`${provider} API key removed from storage`);
        resolve({ success: true });
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to remove ${provider} API key:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if an API key is currently stored for a provider
 */
export async function hasApiKey(provider: ProviderType): Promise<boolean> {
  const key = await getApiKey(provider);
  return key !== null && key.length > 0;
}

/**
 * Get redacted API key for display
 */
export function redactApiKeyForDisplay(key: string | null | undefined, provider: ProviderType): string {
  return redactApiKey(key, provider);
}
