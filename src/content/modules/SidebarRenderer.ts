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

  /**
   * Generate stylish brand text for "Arbor"
   */
  private static getBrandText(): string {
    return `<span class="arbor-brand-text">Arbor</span>`;
  }

  static render(
    trees: Record<string, ChatTree>,
    currentTreeId: string | null,
    untrackedChats: AvailableChat[],
    hasApiKey: boolean = true,
  ): string {
    const allTrees = Object.values(trees);
    
    // Use stylish brand text instead of logo
    const brandElement = this.getBrandText();

    return `
      <div class="arbor-header">
        <h2>
          ${brandElement}
        </h2>
        <div class="arbor-header-actions">
          <button id="open-settings-from-sidebar-btn" class="arbor-icon-btn" aria-label="Open Settings" data-tooltip="Settings - Configure API keys and extension preferences">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M14.625 9c0 .563-.113 1.125-.338 1.575l1.575 1.238c.225.225.338.563.225.788l-1.462 2.587c-.113.225-.45.338-.675.225l-1.913-.788c-.45.338-1.012.563-1.575.675v1.575c0 .338-.225.563-.563.563H8.325c-.338 0-.563-.225-.563-.563V15.3c-.562-.113-1.125-.337-1.575-.675l-1.912.788c-.225.112-.563 0-.675-.225L2.138 12.6c-.113-.225 0-.563.225-.788l1.575-1.237c-.225-.45-.338-1.013-.338-1.575s.113-1.125.338-1.575L2.363 6.188c-.225-.225-.338-.563-.225-.788L3.6 2.813c.113-.225.45-.338.675-.225l1.913.788c.45-.338 1.012-.563 1.575-.675V1.125c0-.338.225-.563.562-.563h2.55c.338 0 .563.225.563.563v1.575c.562.112 1.125.337 1.575.675l1.912-.788c.225-.113.563 0 .675.225l1.463 2.587c.112.225 0 .563-.226.788l-1.575 1.237c.225.45.338 1.013.338 1.575z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button id="close-sidebar-btn" class="arbor-icon-btn" aria-label="Close sidebar" data-tooltip="Close sidebar - Hide the Arbor sidebar panel">
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
          allTrees.length === 0
            ? `<div class="arbor-empty-state">
                <div class="arbor-empty-state-icon">🌱</div>
                <div class="arbor-empty-state-title">Welcome to Arbor</div>
                <div class="arbor-empty-state-description">Create your first tree below</div>
              </div>`
            : ""
        }
        ${
          currentTreeId && trees[currentTreeId]
            ? this.renderCurrentTree(trees[currentTreeId], allTrees, currentTreeId)
            : ""
        }
        ${
          untrackedChats.length > 0
            ? this.renderUntrackedChats(untrackedChats)
            : ""
        }
      </div>
      <div class="arbor-action-buttons">
        <button class="arbor-btn arbor-btn-primary" id="new-chat-btn" style="width: 100%;" data-tooltip="New Chat - Start a new conversation in ChatGPT">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          New Chat
        </button>
        <div class="arbor-action-buttons-row">
          <button class="arbor-btn arbor-btn-secondary" id="create-branch" data-tooltip="Branch - Create a new branch from the current chat">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="3" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <circle cx="11" cy="11" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <circle cx="11" cy="3" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <path d="M3 4.5v3.5a2 2 0 0 0 2 2h4M7 9.5l2.5 2.5L12 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Branch
          </button>
          <button class="arbor-btn arbor-btn-secondary" id="new-tree" data-tooltip="New Tree - Create a new conversation tree">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="2" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <path d="M7 3.5v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <circle cx="4" cy="9" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <circle cx="10" cy="9" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <circle cx="7" cy="12" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <path d="M5.5 8l1.5-1.5L8.5 8M7 10.5V6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            New Tree
          </button>
        </div>
      </div>
    `;
  }


  private static renderCurrentTree(tree: ChatTree, allTrees: ChatTree[], currentTreeId: string): string {
    const displayName =
      tree.name && tree.name.trim() && tree.name !== "undefined"
        ? tree.name
        : "Unnamed Tree";
    
    const nodeCount = Object.keys(tree.nodes).length;
    const branchCount = nodeCount > 1 ? nodeCount - 1 : 0;
    const rootNode = tree.nodes[tree.rootNodeId];
    const rootEmoji = rootNode?.customEmoji || "";

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
              <button id="open-graph-window-btn" class="arbor-action-btn" data-tooltip="Open graph - View the tree structure in a new visualization window">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/>
                  <path d="M1 1l2 2M13 1l-2 2M1 13l2-2M13 13l-2-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
              <button id="tree-title-editable" class="arbor-action-btn" data-tooltip="Edit tree name - Change the name of this conversation tree">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 2.5l2 2M2 12l2.5-0.5 6.5-6.5-2-2L2.5 9.5L2 12z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  <path d="M8 4l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
              <button id="delete-tree-btn" class="arbor-action-btn arbor-delete-tree-btn" data-tooltip="Delete tree - Permanently remove this tree and all its nodes">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 7v4M5 7v4M3 4l1 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-8" 
                        stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="arbor-collapsible-content" data-section-content="current-tree">
            <div class="arbor-tree-dropdown-wrapper" style="position: relative;">
              ${this.renderTreeInfoCard(displayName, branchCount, nodeCount, rootEmoji)}
              ${this.renderTreeDropdownMenu(allTrees, currentTreeId)}
            </div>
            ${this.renderTreeChildren(tree, tree.rootNodeId)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render a distinguished info card for the current tree title with integrated dropdown
   */
  private static renderTreeInfoCard(
    treeName: string,
    branchCount: number,
    nodeCount: number,
    rootEmoji: string,
  ): string {
    return `
      <button class="arbor-tree-info-card" id="tree-selector" aria-haspopup="true" aria-expanded="false">
        <div class="arbor-tree-info-icon">
          ${rootEmoji ? `<span class="arbor-tree-info-emoji">${rootEmoji}</span>` : `
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="3" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M9 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="6" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <circle cx="9" cy="16" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M7.5 11l1.5-2 1.5 2M9 14V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          `}
        </div>
        <div class="arbor-tree-info-content">
          <div class="arbor-tree-info-title">${treeName}</div>
          <div class="arbor-tree-info-meta">
            <span class="arbor-tree-info-badge">${branchCount} branches</span>
            <span class="arbor-tree-info-separator">•</span>
            <span class="arbor-tree-info-badge">${nodeCount} chats</span>
          </div>
        </div>
        <svg class="arbor-tree-info-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;
  }

  /**
   * Render the dropdown menu for tree selection
   */
  private static renderTreeDropdownMenu(
    trees: ChatTree[],
    currentTreeId: string | null,
  ): string {
    return `
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
    `;
  }


  /**
   * Render only the children of the root node (skipping root itself)
   */
  private static renderTreeChildren(tree: ChatTree, rootNodeId: string): string {
    const rootNode = tree.nodes[rootNodeId];
    if (!rootNode || rootNode.children.length === 0) {
      return `<div class="arbor-tree-empty-message">No branches yet. Create a branch from the current chat.</div>`;
    }

    let html = `<div class="arbor-tree-children-container">`;
    rootNode.children.forEach((childId) => {
      html += this.renderTreeNode(tree, childId, 0);
    });
    html += `</div>`;
    return html;
  }

  /**
   * Render a single tree node with card-based styling
   */
  private static renderTreeNode(
    tree: ChatTree,
    nodeId: string,
    depth: number = 0,
  ): string {
    const node = tree.nodes[nodeId];
    if (!node) {
      return "";
    }

    const hasChildren = node.children.length > 0;
    const connectionIcon = node.customEmoji || "";

    let html = `
      <div class="tree-node-card" 
           data-node-id="${nodeId}" 
           draggable="true"
           role="treeitem"
           aria-label="${node.title}${hasChildren ? ` (${node.children.length} ${node.children.length === 1 ? "branch" : "branches"})` : ""}"
           ${hasChildren ? 'aria-expanded="true"' : ""}
           tabindex="0"
           style="margin-left: ${depth * 16}px;">
        <div class="tree-node-card-header">
          ${
            hasChildren
              ? `<button class="tree-node-collapse-btn" 
                         data-node-id="${nodeId}" 
                         aria-expanded="true"
                         aria-label="Collapse ${node.title}"
                         tabindex="-1">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2.5 3.5L5 6L7.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>`
              : `<div class="tree-node-spacer"></div>`
          }
          ${connectionIcon ? `<span class="tree-node-icon" aria-hidden="true">${connectionIcon}</span>` : ''}
          <div class="tree-node-card-content">
            <div class="tree-node-title">${node.title}</div>
            ${
              hasChildren
                ? `<div class="tree-node-meta">
                    <span class="tree-node-branch-badge">${node.children.length}</span>
                  </div>`
                : ""
            }
          </div>
          <div class="tree-node-actions">
            <button class="edit-node-btn" 
                    data-node-id="${nodeId}" 
                    aria-label="Rename ${node.title}"
                    tabindex="-1"
                    title="Rename">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 1.5l2 2M1.5 10.5l2-0.5 5.5-5.5-2-2L1.5 8l-0.5 2z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M6.5 3l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="delete-node-btn" 
                    data-node-id="${nodeId}" 
                    aria-label="Delete ${node.title}"
                    tabindex="-1"
                    title="Delete">×</button>
          </div>
        </div>
      </div>
    `;

    if (hasChildren) {
      html += `<div class="tree-node-children" 
                    data-parent-node-id="${nodeId}"
                    role="group"
                    aria-label="${node.title} children">`;
      node.children.forEach((childId) => {
        html += this.renderTreeNode(tree, childId, depth + 1);
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
            <div class="arbor-untracked-list" role="list" aria-label="Untracked chats">
              ${chats
                .slice(0, 15)
                .map(
                  (chat, index) => `
                <div class="arbor-untracked-item" 
                     data-chat-index="${index}" 
                     data-chat-url="${chat.url}"
                     role="listitem"
                     tabindex="0">
                  <span class="arbor-untracked-item-title">
                    ${chat.title}
                  </span>
                  <button class="arbor-add-btn add-to-tree-btn" 
                          data-chat-index="${index}"
                          aria-label="Add ${chat.title} to tree"
                          title="Add to tree">+</button>
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
