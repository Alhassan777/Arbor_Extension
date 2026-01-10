import { db } from "../db";
import type { ChatTree, ChatNode } from "../../types";

export class TreeManager {
  async createTree(
    name: string,
    platform: "chatgpt" | "gemini" | "perplexity"
  ): Promise<ChatTree> {
    const treeId = `tree-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const rootNodeId = `node-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const rootNode: ChatNode = {
      id: rootNodeId,
      title: name,
      url: window.location.href,
      platform,
      parentId: null,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tree: ChatTree = {
      id: treeId,
      name,
      rootNodeId,
      nodes: {
        [rootNodeId]: rootNode,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveTree(tree);
    await db.saveNode(rootNode, treeId);

    return tree;
  }

  async deleteTree(
    treeId: string,
    trees: Record<string, ChatTree>
  ): Promise<{ success: boolean; nextTreeId: string | null; error?: string }> {
    const tree = trees[treeId];
    if (!tree) {
      return { success: false, nextTreeId: null, error: "Tree not found" };
    }

    try {
      // Recursively delete all nodes starting from root
      const deleteNodeRecursive = async (nodeId: string) => {
        const node = tree.nodes[nodeId];
        if (!node) return;

        // Delete all children first
        for (const childId of [...node.children]) {
          await deleteNodeRecursive(childId);
        }

        // Delete the node from database
        await db.deleteNode(nodeId);
        delete tree.nodes[nodeId];
      };

      // Delete all nodes in the tree
      await deleteNodeRecursive(tree.rootNodeId);

      // Delete the tree from database
      await db.deleteTree(treeId);
      delete trees[treeId];

      // Return next tree ID if available
      const remainingTrees = Object.keys(trees);
      const nextTreeId = remainingTrees.length > 0 ? remainingTrees[0] : null;

      return { success: true, nextTreeId };
    } catch (error) {
      console.error("Error deleting tree:", error);
      return {
        success: false,
        nextTreeId: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async renameTree(
    treeId: string,
    newName: string,
    trees: Record<string, ChatTree>
  ): Promise<void> {
    const tree = trees[treeId];
    if (!tree) return;

    tree.name = newName;
    tree.updatedAt = new Date().toISOString();
    await db.saveTree(tree);
  }
}
