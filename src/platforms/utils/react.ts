/**
 * React-specific utility functions for platform adapters
 */

/**
 * Set value on a React-controlled input or textarea element
 * Properly triggers React's synthetic event system
 * 
 * @param element - The input or textarea element
 * @param value - The value to set
 */
export function setInputValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  // Get the native value setter to bypass React's synthetic events
  const nativeInputValueSetter =
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Trigger React events
  triggerReactEvents(element);

  // Set cursor position to end
  element.setSelectionRange(value.length, value.length);
}

/**
 * Set text content on a contenteditable element
 * Uses textContent (not innerHTML) to prevent XSS
 * 
 * @param element - The contenteditable element
 * @param value - The text content to set
 */
export function setContentEditableValue(element: HTMLElement, value: string): void {
  // Use textContent to prevent XSS (not innerHTML)
  element.textContent = value;

  // Trigger input events
  triggerReactEvents(element);

  // Move cursor to end
  const range = document.createRange();
  const selection = window.getSelection();
  
  if (element.childNodes.length > 0) {
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}

/**
 * Trigger React's synthetic event system
 * Fires all necessary events for React to detect the change
 * 
 * @param element - The element to trigger events on
 */
export function triggerReactEvents(element: HTMLElement): void {
  // Create and dispatch input event (most important for React)
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  element.dispatchEvent(inputEvent);

  // Also dispatch change event
  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  element.dispatchEvent(changeEvent);

  // For textarea/input, also dispatch keyboard events
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const keydownEvent = new KeyboardEvent('keydown', { bubbles: true });
    element.dispatchEvent(keydownEvent);

    const keyupEvent = new KeyboardEvent('keyup', { bubbles: true });
    element.dispatchEvent(keyupEvent);
  }

  // For contenteditable, dispatch InputEvent with inputType
  if (element.getAttribute('contenteditable') === 'true') {
    const inputEventWithType = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
    });
    element.dispatchEvent(inputEventWithType);
  }
}

/**
 * Focus an element and ensure it's ready for input
 * Waits a brief moment after focusing to ensure focus is properly set
 * 
 * @param element - The element to focus
 * @returns Promise that resolves when element is focused
 */
export async function focusElement(element: HTMLElement): Promise<void> {
  element.focus();
  // Wait for focus to properly register
  await new Promise((resolve) => setTimeout(resolve, 100));
}
