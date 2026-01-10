/**
 * ContextFormatter - Interface for formatting conversation context
 */

import type { ConnectionType } from "../../../types";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface FormatOptions {
  parentTitle: string;
  selectedText?: string;
  connectionType: ConnectionType;
  messageLength?: number | "full"; // 100 | 200 | 500 | 'full'
  messageCount?: number; // How many messages to include
  customPrompt?: string; // Custom summarization prompt (optional)
  customConnectionType?: string; // Custom connection type label if connectionType is 'custom'
}

export interface ContextFormatter {
  format(messages: Message[], options: FormatOptions): string;
}
