/**
 * Helper functions to access chrome.storage.session from content scripts
 * (session storage is only available in background/service worker context in Manifest V3)
 */

/**
 * Get values from session storage via background script
 */
export async function getSessionStorage(
  keys: string[],
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "storage-session-get",
        payload: { keys },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response || !response.success) {
          reject(new Error(response?.error || "Failed to get session storage"));
          return;
        }
        resolve(response.data || {});
      },
    );
  });
}

/**
 * Set values in session storage via background script
 */
export async function setSessionStorage(
  items: Record<string, any>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "storage-session-set",
        payload: { items },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response || !response.success) {
          reject(new Error(response?.error || "Failed to set session storage"));
          return;
        }
        resolve();
      },
    );
  });
}

/**
 * Remove keys from session storage via background script
 */
export async function removeSessionStorage(keys: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "storage-session-remove",
        payload: { keys },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response || !response.success) {
          reject(
            new Error(response?.error || "Failed to remove session storage"),
          );
          return;
        }
        resolve();
      },
    );
  });
}
