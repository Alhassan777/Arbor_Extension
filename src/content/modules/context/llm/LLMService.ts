/**
 * LLMService - Interface for Large Language Model services
 * Used for intelligent context processing in the extension
 */

import type { Message } from "../ContextFormatter";
import type { ConnectionType } from "../../../../types";

export interface SummaryOptions {
  maxLength?: number;
  style?: "brief" | "detailed" | "bullet";
  customPrompt?: string; // Custom prompt for summarization (optional)
}

export interface LLMService {
  /**
   * Generate an intelligent summary of conversation messages
   * @param messages - Array of conversation messages
   * @param options - Summary generation options
   * @returns Promise resolving to summary string
   */
  summarize(messages: Message[], options?: SummaryOptions): Promise<string>;

  /**
   * Extract key points from conversation
   * @param messages - Array of conversation messages
   * @returns Promise resolving to array of key point strings
   */
  extractKeyPoints(messages: Message[]): Promise<string[]>;

  /**
   * Suggest connection type based on conversation content
   * @param messages - Array of conversation messages
   * @returns Promise resolving to suggested connection type
   */
  suggestConnectionType(messages: Message[]): Promise<ConnectionType>;

  /**
   * Check if the service is available/configured
   * @returns Promise resolving to availability status
   */
  isAvailable(): Promise<boolean>;
}
