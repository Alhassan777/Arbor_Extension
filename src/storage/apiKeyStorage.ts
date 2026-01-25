/**
 * Secure API Key Storage Utility
 * 
 * Stores Gemini API keys securely using chrome.storage.local
 * - Keys are encrypted using Web Crypto API (AES-GCM) before storage
 * - Encryption key is derived from extension ID
 * - Keys are never logged in full - always redacted for security
 */

import { logger } from "../utils/logger";

const STORAGE_KEY = "gemini_api_key";
const ENCRYPTION_MARKER = "__encrypted__";
const ENCRYPTION_KEY_NAME = "arbor_encryption_key";

// Web Crypto API algorithm
const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

/**
 * Redact API key for safe logging (only shows first 7 chars: "AIza...")
 */
function redactApiKey(key: string | null | undefined): string {
  if (!key) return "[no key]";
  if (key.length <= 10) return "[invalid]";
  return `${key.substring(0, 7)}...****`;
}

/**
 * Storage key for the master encryption key
 */
const MASTER_KEY_STORAGE = "arbor_master_encryption_key";

/**
 * Generate or retrieve unique per-installation encryption key
 * This ensures each extension installation has a truly unique, random key
 * SECURITY: This provides better security than deriving from extension ID (which is public)
 */
async function getMasterEncryptionKey(): Promise<CryptoKey> {
  try {
    // Try to retrieve existing key
    const stored = await new Promise<any>((resolve) => {
      chrome.storage.local.get([MASTER_KEY_STORAGE], (result) => {
        resolve(result[MASTER_KEY_STORAGE]);
      });
    });

    if (stored?.keyData) {
      // Import existing key from storage
      const keyBytes = Uint8Array.from(atob(stored.keyData), c => c.charCodeAt(0));
      return await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
      );
    }

    // Generate new random key (first-time installation)
    const key = await crypto.subtle.generateKey(
      { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
      true, // extractable (so we can store it)
      ["encrypt", "decrypt"]
    );

    // Export and store the key for future use
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
 * Get encryption key (wrapper for backward compatibility)
 */
async function deriveEncryptionKey(): Promise<CryptoKey> {
  return await getMasterEncryptionKey();
}

/**
 * Encrypt API key using AES-GCM
 */
async function encryptApiKey(apiKey: string): Promise<{ encrypted: string; iv: string }> {
  try {
    const key = await deriveEncryptionKey();
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the API key
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      new TextEncoder().encode(apiKey)
    );
    
    // Convert to base64 for storage
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
    const key = await deriveEncryptionKey();
    
    // Convert from base64
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivData), c => c.charCodeAt(0));
    
    // Decrypt
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
 * Validate API key format
 * Gemini API keys start with "AIza" and are typically 39+ characters
 * SECURITY: Enhanced with length limits and character validation to prevent DoS/injection attacks
 */
export function validateApiKeyFormat(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== "string") {
    return { valid: false, error: "API key is required" };
  }

  const trimmed = key.trim();

  // Maximum length check to prevent DoS attacks
  if (trimmed.length > 200) {
    return { valid: false, error: "API key is too long (maximum 200 characters)" };
  }

  if (trimmed.length < 30) {
    return { valid: false, error: "API key is too short (minimum 30 characters)" };
  }

  if (!trimmed.startsWith("AIza")) {
    return { valid: false, error: "Invalid API key format (must start with 'AIza')" };
  }
  
  // Only allow alphanumeric characters, hyphens, and underscores (common in API keys)
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: "API key contains invalid characters (only alphanumeric, hyphens, and underscores allowed)" };
  }

  return { valid: true };
}

/**
 * Get the stored API key (decrypts if encrypted)
 * @returns Promise resolving to API key string or null if not set
 */
export async function getApiKey(): Promise<string | null> {
  try {
    return new Promise(async (resolve, reject) => {
      chrome.storage.local.get([STORAGE_KEY], async (result) => {
        if (chrome.runtime.lastError) {
          logger.error("Error getting API key:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const stored = result[STORAGE_KEY];
        
        if (!stored) {
          logger.debug("No API key found in storage");
          resolve(null);
          return;
        }

        try {
          let apiKey: string;
          
          // Check if encrypted (new format)
          if (isEncrypted(stored)) {
            apiKey = await decryptApiKey(stored.encrypted, stored.iv);
          } else if (typeof stored === "string") {
            // Legacy unencrypted format - migrate it
            logger.debug("Migrating unencrypted API key to encrypted format");
            apiKey = stored;
            
            // Re-encrypt and save
            try {
              const encrypted = await encryptApiKey(apiKey);
              chrome.storage.local.set({
                [STORAGE_KEY]: {
                  marker: ENCRYPTION_MARKER,
                  encrypted: encrypted.encrypted,
                  iv: encrypted.iv,
                }
              });
            } catch (migrationError) {
              logger.warn("Failed to migrate API key to encrypted format", migrationError);
              // Continue with unencrypted key if migration fails
            }
          } else {
            logger.error("Invalid API key format in storage");
            resolve(null);
            return;
          }

          logger.debug("API key retrieved from storage");
          resolve(apiKey);
        } catch (decryptError) {
          logger.error("Failed to decrypt API key", decryptError);
          reject(new Error("Failed to decrypt stored API key. Please re-enter your API key."));
        }
      });
    });
  } catch (error) {
    logger.error("Failed to get API key:", error);
    return null;
  }
}

/**
 * Store an API key securely (encrypts before storage)
 * @param apiKey - The API key to store
 * @returns Promise resolving to success status
 */
export async function setApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  // Validate format before storing
  const validation = validateApiKeyFormat(apiKey);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const trimmed = apiKey.trim();

  try {
    // Encrypt the API key before storage
    const encrypted = await encryptApiKey(trimmed);
    
    const storageValue = {
      marker: ENCRYPTION_MARKER,
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
    };

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: storageValue }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          logger.error("Error saving API key:", error);
          reject(new Error(error));
          return;
        }

        logger.debug("API key encrypted and saved to secure storage");
        resolve({ success: true });
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to save API key:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove the stored API key
 * @returns Promise resolving to success status
 */
export async function removeApiKey(): Promise<{ success: boolean; error?: string }> {
  try {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([STORAGE_KEY], () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          logger.error("Error removing API key:", error);
          reject(new Error(error));
          return;
        }

        logger.debug("API key removed from storage");
        resolve({ success: true });
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to remove API key:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if an API key is currently stored
 * @returns Promise resolving to boolean
 */
export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return key !== null && key.length > 0;
}
