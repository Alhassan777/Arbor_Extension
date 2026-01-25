// Simplified types for browser extension
export interface ChatNode {
  id: string;
  title: string;
  url: string;
  platform: 'chatgpt' | 'gemini' | 'claude' | 'perplexity';
  parentId: string | null;
  children: string[]; // array of child IDs
  createdAt: string;
  updatedAt: string;

  // Optional context
  summary?: string;
  tags?: string[];
  connectionLabel?: ConnectionType;

  // Visual customization
  customPosition?: { x: number; y: number }; // Custom position on canvas
  color?: string; // Hex color code
  shape?: 'rectangle' | 'circle' | 'rounded' | 'diamond';
}

export interface Connection {
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  type?: ConnectionType;
  style?: 'solid' | 'dashed' | 'dotted' | 'curved';
  color?: string;
}

export type ConnectionType =
  | 'deepens'
  | 'explores'
  | 'contrasts'
  | 'examples'
  | 'applies'
  | 'questions'
  | 'extends'
  | 'summarizes'
  | 'custom';

export interface ChatTree {
  id: string;
  name: string; // Tree name (independent from node titles)
  rootNodeId: string;
  nodes: Record<string, ChatNode>; // nodeId -> ChatNode
  connections?: Connection[]; // Custom connections
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionState {
  trees: Record<string, ChatTree>; // treeId -> ChatTree
  currentTreeId: string | null;
  currentNodeId: string | null;
  sidebarVisible: boolean;
  graphSidebarVisible: boolean;
}

export interface Platform {
  name: string;
  isActive(): boolean;
  getChatId(): string | null;
  detectCurrentChatUrl(): string | null;
  detectChatTitle(): string | null;
  isInConversation(): boolean;
  getSelectedText(): string | null;
  openNewChat(context?: string, parentNodeId?: string, parentTreeId?: string): void;
  navigateToChat(chatId: string): void;
  generateBranchContext(params: {
    parentTitle: string;
    summary?: string;
    selectedText?: string;
    connectionType?: string;
  }): string;
  copyToClipboard(text: string): Promise<boolean>;
  onNavigationChange(callback: (chatId: string | null) => void): (() => void);
  extractMessages(): Array<{ role: 'user' | 'assistant'; content: string }>;
  getRecentMessages(count?: number): Array<{ role: 'user' | 'assistant'; content: string }>;
  renameChat(chatUrl: string, newTitle: string): Promise<boolean>;
  getAllChatsFromSidebar(): Array<{ id: string; title: string; url: string }>;
  pasteIntoInput(text: string): Promise<boolean>;
  cleanup(): void;
}
