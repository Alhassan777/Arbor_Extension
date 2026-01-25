/**
 * SidebarRenderer - Handles sidebar HTML generation
 */

import type { ChatTree } from "../../types";
import type { AvailableChat } from "./UIInjector";

export class SidebarRenderer {
  /**
   * Safely get extension resource URL, handling invalidated extension context
   */
  private static getResourceURL(path: string): string {
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.getURL
      ) {
        return chrome.runtime.getURL(path);
      }
    } catch (error) {
      // Extension context invalidated - return empty string or data URI fallback
      console.warn(
        "🌳 Arbor: Extension context invalidated, using fallback for resource:",
        path,
      );
    }
    // Return empty string as fallback - the image will fail to load but won't crash
    return "";
  }

  static render(
    trees: Record<string, ChatTree>,
    currentTreeId: string | null,
    untrackedChats: AvailableChat[],
    hasApiKey: boolean = true,
  ): string {
    const allTrees = Object.values(trees);
    const logoURL = this.getResourceURL("icons/logo.webp");

    return `
      <div class="arbor-header">
        <h2>
          ${logoURL ? `<img src="${logoURL}" alt="Arbor" class="arbor-logo" />` : ""}
          <span>Arbor</span>
        </h2>
        <div class="arbor-header-actions">
          <button id="open-settings-from-sidebar-btn" class="arbor-icon-btn" aria-label="Open Settings" title="Settings">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M14.625 9c0 .563-.113 1.125-.338 1.575l1.575 1.238c.225.225.338.563.225.788l-1.462 2.587c-.113.225-.45.338-.675.225l-1.913-.788c-.45.338-1.012.563-1.575.675v1.575c0 .338-.225.563-.563.563H8.325c-.338 0-.563-.225-.563-.563V15.3c-.562-.113-1.125-.337-1.575-.675l-1.912.788c-.225.112-.563 0-.675-.225L2.138 12.6c-.113-.225 0-.563.225-.788l1.575-1.237c-.225-.45-.338-1.013-.338-1.575s.113-1.125.338-1.575L2.363 6.188c-.225-.225-.338-.563-.225-.788L3.6 2.813c.113-.225.45-.338.675-.225l1.913.788c.45-.338 1.012-.563 1.575-.675V1.125c0-.338.225-.563.562-.563h2.55c.338 0 .563.225.563.563v1.575c.562.112 1.125.337 1.575.675l1.912-.788c.225-.113.563 0 .675.225l1.463 2.587c.112.225 0 .563-.226.788l-1.575 1.237c.225.45.338 1.013.338 1.575z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button id="close-sidebar-btn" class="arbor-icon-btn" aria-label="Close sidebar" title="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="arbor-content">
        ${
          !hasApiKey
            ? `<div class="arbor-api-notice">
                <div class="arbor-api-notice-header">
                  <div style="flex: 1;">
                    <strong class="arbor-api-notice-title">API Key Required</strong>
                    <p class="arbor-api-notice-text">Add your Gemini API key to enable intelligent features like summarization and context generation for your ChatGPT conversations.</p>
                  </div>
                </div>
                <button id="open-settings-btn" class="arbor-btn arbor-btn-secondary" style="width: 100%; margin-top: 8px;">
                  Open Settings
                </button>
              </div>`
            : ""
        }
        ${
          allTrees.length > 0
            ? this.renderTreesList(allTrees, currentTreeId)
            : `<div class="arbor-empty-state">
                <div class="arbor-empty-state-icon">🌱</div>
                <div class="arbor-empty-state-title">Welcome to Arbor</div>
                <div class="arbor-empty-state-description">Create your first tree below</div>
              </div>`
        }
        ${
          currentTreeId && trees[currentTreeId]
            ? this.renderCurrentTree(trees[currentTreeId])
            : ""
        }
        ${
          untrackedChats.length > 0
            ? this.renderUntrackedChats(untrackedChats)
            : ""
        }
      </div>
      <div class="arbor-action-buttons">
        <button class="arbor-btn arbor-btn-primary" id="new-chat-btn" style="width: 100%;">
          New Chat
        </button>
        <div class="arbor-action-buttons-row">
          <button class="arbor-btn arbor-btn-secondary" id="create-branch">
            Branch
          </button>
          <button class="arbor-btn arbor-btn-secondary" id="new-tree">
            New Tree
          </button>
        </div>
      </div>
    `;
  }

  private static renderTreesList(
    trees: ChatTree[],
    currentTreeId: string | null,
  ): string {
    const currentTree = trees.find((t) => t.id === currentTreeId);
    const currentTreeName = currentTree?.name || "Select a tree";
    const nodeCount = currentTree ? Object.keys(currentTree.nodes).length : 0;
    const branchCount = nodeCount > 1 ? nodeCount - 1 : 0;

    return `
      <div class="arbor-section">
        <div class="arbor-section-header">MY TREES</div>
        <div class="arbor-tree-dropdown">
          <button class="arbor-tree-dropdown-trigger" id="tree-selector">
            <div class="arbor-tree-dropdown-content">
              <div class="arbor-tree-dropdown-title">${currentTreeName}</div>
              ${currentTreeId ? `<div class="arbor-tree-dropdown-meta">${branchCount} branches • ${nodeCount} chats</div>` : ""}
            </div>
            <svg class="arbor-tree-dropdown-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="arbor-tree-dropdown-menu" id="tree-dropdown-menu" style="display: none;">
            <div class="arbor-tree-dropdown-search">
              <input type="text" placeholder="Search trees..." class="arbor-tree-dropdown-search-input" id="tree-search-input" />
            </div>
            <div class="arbor-tree-dropdown-list">
              ${trees
                .map((tree) => {
                  const isActive = tree.id === currentTreeId;
                  const treeNodeCount = Object.keys(tree.nodes).length;
                  const treeBranchCount =
                    treeNodeCount > 1 ? treeNodeCount - 1 : 0;

                  return `
                  <div class="arbor-tree-dropdown-item ${isActive ? "active" : ""}" data-tree-id="${tree.id}">
                    <div class="arbor-tree-dropdown-item-content">
                      <div class="arbor-tree-dropdown-item-title">${tree.name || "Unnamed Tree"}</div>
                      <div class="arbor-tree-dropdown-item-meta">${treeBranchCount} branches • ${treeNodeCount} chats</div>
                    </div>
                    ${
                      isActive
                        ? `<svg class="arbor-tree-dropdown-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`
                        : ""
                    }
                  </div>
                `;
                })
                .join("")}
            </div>
            <div class="arbor-tree-dropdown-footer">
              <button class="arbor-tree-dropdown-new" id="new-tree-from-dropdown">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                New Tree
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private static renderCurrentTree(tree: ChatTree): string {
    const displayName =
      tree.name && tree.name.trim() && tree.name !== "undefined"
        ? tree.name
        : "Unnamed Tree";

    return `
      <div class="arbor-section arbor-section-divider">
        <div class="arbor-collapsible-section">
          <div class="arbor-collapsible-header" data-section="current-tree">
            <button class="arbor-collapsible-chevron" aria-expanded="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="arbor-section-header">CURRENT TREE</span>
            <div class="arbor-collapsible-actions">
              <button id="tree-title-editable" class="arbor-action-btn" title="Edit tree name">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 12h10M10.5 2.5a1.5 1.5 0 0 1 2 2L4 13H2v-2l8.5-8.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
              <button id="tree-context-menu" class="arbor-action-btn" title="More options">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="3" r="1" fill="currentColor"/>
                  <circle cx="7" cy="7" r="1" fill="currentColor"/>
                  <circle cx="7" cy="11" r="1" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="arbor-collapsible-content" data-section-content="current-tree">
            ${this.renderTreeNodes(tree, tree.rootNodeId)}
          </div>
        </div>
      </div>
    `;
  }

  private static renderTreeNodes(
    tree: ChatTree,
    nodeId: string,
    depth: number = 0,
  ): string {
    const node = tree.nodes[nodeId];
    if (!node) {
      console.log("⚠️ [DRAG-DEBUG] RENDER: Node not found:", nodeId);
      return "";
    }

    console.log("🎨 [DRAG-DEBUG] RENDERING NODE:", {
      nodeId,
      title: node.title,
      parentId: node.parentId,
      children: node.children,
      depth,
    });

    const hasChildren = node.children.length > 0;
    const isRootNode = nodeId === tree.rootNodeId;

    // Get connection type icon
    const getConnectionIcon = () => {
      if (isRootNode) return "⬤"; // Root indicator
      if (hasChildren) return "↗"; // Has children (extends)
      return "🍃"; // Leaf node
    };

    const connectionIcon = getConnectionIcon();

    let html = `
      <div class="tree-node ${!isRootNode ? "draggable" : ""}" 
           data-node-id="${nodeId}" 
           ${!isRootNode ? 'draggable="true"' : ""}
           style="margin-left: ${depth * 16}px;">
        ${
          hasChildren
            ? `<button class="tree-node-collapse-btn" data-node-id="${nodeId}" aria-expanded="true">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>`
            : `<div class="tree-node-spacer"></div>`
        }
        <div class="tree-node-icon">${connectionIcon}</div>
        <div style="flex: 1; min-width: 0;">
          <div class="tree-node-title">
            ${node.title}
          </div>
          ${
            hasChildren
              ? `<div class="tree-node-meta">
                  <span class="tree-node-branch-badge">${node.children.length}</span>
                </div>`
              : ""
          }
        </div>
        ${
          !isRootNode
            ? `<button class="delete-node-btn" data-node-id="${nodeId}" title="Delete node">×</button>`
            : ""
        }
      </div>
    `;

    if (hasChildren) {
      html += `<div class="tree-node-children" data-parent-node-id="${nodeId}">`;
      node.children.forEach((childId) => {
        html += this.renderTreeNodes(tree, childId, depth + 1);
      });
      html += `</div>`;
    }

    return html;
  }

  private static renderUntrackedChats(chats: AvailableChat[]): string {
    return `
      <div class="arbor-section arbor-section-divider">
        <div class="arbor-collapsible-section">
          <div class="arbor-collapsible-header" data-section="untracked-chats">
            <button class="arbor-collapsible-chevron" aria-expanded="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="arbor-section-header">UNTRACKED CHATS (${chats.length})</span>
          </div>
          <div class="arbor-collapsible-content" data-section-content="untracked-chats">
            <div class="arbor-untracked-list">
              ${chats
                .slice(0, 15)
                .map(
                  (chat, index) => `
                <div class="arbor-untracked-item" data-chat-index="${index}" data-chat-url="${chat.url}">
                  <span class="arbor-untracked-item-title">
                    ${chat.title.substring(0, 42)}${
                      chat.title.length > 42 ? "..." : ""
                    }
                  </span>
                  <span class="arbor-add-btn add-to-tree-btn" data-chat-index="${index}">+</span>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
