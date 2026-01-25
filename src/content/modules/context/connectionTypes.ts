/**
 * Connection Types Configuration
 * Centralized definition of connection types for the extension
 */

import type { ConnectionType } from "../../../types";

export interface ConnectionTypeConfig {
  type: ConnectionType;
  description: string;
  emoji: string;
  canSuggest: boolean; // Whether LLM can suggest this type
}

/**
 * All available connection types with metadata
 */
export const CONNECTION_TYPES: ConnectionTypeConfig[] = [
  {
    type: "extends",
    description: "Let's extend this discussion to related areas.",
    emoji: "🔗",
    canSuggest: true,
  },
  {
    type: "deepens",
    description: "Let's explore this topic in more depth.",
    emoji: "🔍",
    canSuggest: true,
  },
  {
    type: "explores",
    description: "Let's explore a related aspect of this.",
    emoji: "🧭",
    canSuggest: true,
  },
  {
    type: "examples",
    description: "Let's look at specific examples of this.",
    emoji: "💡",
    canSuggest: true,
  },
  {
    type: "applies",
    description: "Let's discuss how to apply this in practice.",
    emoji: "⚙️",
    canSuggest: true,
  },
  {
    type: "questions",
    description: "I have some questions about this.",
    emoji: "❓",
    canSuggest: true,
  },
  {
    type: "contrasts",
    description: "Let's consider an alternative perspective on this.",
    emoji: "🔄",
    canSuggest: true,
  },
  {
    type: "summarizes",
    description: "Let's summarize and consolidate what we've discussed.",
    emoji: "📋",
    canSuggest: true,
  },
  {
    type: "custom",
    description: "Custom connection type (enter your own label)",
    emoji: "✏️",
    canSuggest: false, // LLM cannot suggest "custom" - user must choose it
  },
];

/**
 * Get connection types that can be suggested by LLM
 */
export function getSuggestableConnectionTypes(): ConnectionType[] {
  return CONNECTION_TYPES.filter((ct) => ct.canSuggest).map((ct) => ct.type);
}

/**
 * Get all connection types
 */
export function getAllConnectionTypes(): ConnectionType[] {
  return CONNECTION_TYPES.map((ct) => ct.type);
}

/**
 * Get connection type config by type
 */
export function getConnectionTypeConfig(
  type: ConnectionType
): ConnectionTypeConfig | undefined {
  return CONNECTION_TYPES.find((ct) => ct.type === type);
}

/**
 * Check if a connection type is valid
 */
export function isValidConnectionType(type: string): type is ConnectionType {
  return CONNECTION_TYPES.some((ct) => ct.type === type);
}
