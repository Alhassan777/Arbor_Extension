/**
 * DOM utility functions for platform adapters
 */

/**
 * Wait for an element to appear in the DOM
 * Returns both the element and a cleanup function to stop observing
 * 
 * @param selector - CSS selector to wait for
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise with element (or null) and cleanup function
 */
export async function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<{ element: Element | null; cleanup: () => void }> {
  return new Promise((resolve) => {
    let resolved = false;
    let observer: MutationObserver | null = null;
    let timeoutId: number | null = null;

    const cleanup = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const resolveWith = (element: Element | null) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({ element, cleanup: () => {} });
    };

    // Check if element already exists
    const existingElement = document.querySelector(selector);
    if (existingElement) {
      return resolveWith(existingElement);
    }

    // Set up observer
    observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        resolveWith(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Set timeout
    timeoutId = window.setTimeout(() => {
      resolveWith(null);
    }, timeout);
  });
}

/**
 * Check if an element is visible in the viewport
 * 
 * @param element - The element to check
 * @returns true if element is visible
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.top >= 0;
}

/**
 * Find the best matching element from a list of selectors
 * Returns the first visible element found, along with the selector used
 * 
 * @param selectors - Array of CSS selectors to try
 * @param filter - Optional filter function to apply to found elements
 * @returns Object with element, selector, and confidence score
 */
export function findBestMatch(
  selectors: string[],
  filter?: (element: Element) => boolean
): { element: Element | null; selector: string | null; confidence: number } {
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    const elements = document.querySelectorAll(selector);

    for (const element of Array.from(elements)) {
      // Check if element passes filter
      if (filter && !filter(element)) {
        continue;
      }

      // Check if element is visible
      if (isElementVisible(element)) {
        // Confidence is higher for earlier selectors
        const confidence = 1 - (i / selectors.length);
        return { element, selector, confidence };
      }
    }
  }

  return { element: null, selector: null, confidence: 0 };
}

/**
 * Debounce a function call
 * 
 * @param func - The function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}
