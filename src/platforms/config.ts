/**
 * Platform configuration interface
 * Contains all platform-specific selectors, URL patterns, and settings
 */
export interface PlatformConfig {
  // URL patterns
  chatIdPattern: RegExp; // Regex to extract chat ID from URL
  baseUrl: string; // Base URL for the platform
  newChatUrl: string; // URL to navigate to for new chat
  chatUrlTemplate: (chatId: string) => string; // Function to build chat URL from ID

  // Hostname detection
  hostnamePattern: string | RegExp; // Pattern to match hostname

  // Input field selectors (in order of preference)
  inputSelectors: string[];
  inputType: 'textarea' | 'contenteditable' | 'input'; // Type of input element

  // Sidebar chat link selectors (in order of preference)
  sidebarLinkSelectors: string[];
  sidebarLinkPattern: RegExp; // Regex to extract chat ID from sidebar link href

  // Title detection selectors (in order of preference)
  titleSelectors: Array<{
    selector: string;
    extractor?: (element: Element) => string | null; // Custom extractor function
  }>;
  titleFallback: string; // Default title if none found

  // Message extraction selectors
  messageSelectors: {
    user: string[];
    assistant: string[];
    container?: string[]; // Optional container selectors
  };
  messageRoleDetector?: (element: Element) => 'user' | 'assistant' | null; // Custom role detector

  // Page title cleanup
  pageTitleCleanup?: (title: string) => string; // Function to clean up page title

  // Rename support
  supportsRename?: boolean; // Whether the platform supports renaming chats
}
