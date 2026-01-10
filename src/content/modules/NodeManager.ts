import { db } from "../db";
import type { ChatTree, ChatNode } from "../../types";

export class NodeManager {
  async createNode(
    parentId: string | null,
    title: string,
    url: string,
    platform: "chatgpt" | "gemini" | "perplexity",
    tree: ChatTree,
    treeId: string
  ): Promise<ChatNode> {
    const nodeId = `node-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const node: ChatNode = {
      id: nodeId,
      title,
      url,
      platform,
      parentId,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tree.nodes[nodeId] = node;

    if (parentId && tree.nodes[parentId]) {
      tree.nodes[parentId].children.push(nodeId);
    }

    await db.saveTree(tree);
    await db.saveNode(node, treeId);

    return node;
  }

  async deleteNode(
    nodeId: string,
    tree: ChatTree,
    treeId: string
  ): Promise<{ success: boolean; error?: string }> {
    const node = tree.nodes[nodeId];
    if (!node) {
      return { success: false, error: "Node not found" };
    }

    // Prevent deleting root node (delete the tree instead)
    if (nodeId === tree.rootNodeId) {
      return {
        success: false,
        error: "Cannot delete root node. Delete the tree instead.",
      };
    }

    try {
      // Recursively delete all descendants
      const deleteDescendants = async (id: string) => {
        const n = tree.nodes[id];
        if (!n) return;

        // Delete all children first
        for (const childId of [...n.children]) {
          await deleteDescendants(childId);
        }

        // Delete the node from database
        await db.deleteNode(id);
        delete tree.nodes[id];
      };

      // Remove from parent's children array
      if (node.parentId && tree.nodes[node.parentId]) {
        const parent = tree.nodes[node.parentId];
        parent.children = parent.children.filter((id) => id !== nodeId);
        parent.updatedAt = new Date().toISOString();
        await db.saveNode(parent, treeId);
      }

      // Delete the node and all its descendants
      await deleteDescendants(nodeId);

      // Update tree timestamp
      tree.updatedAt = new Date().toISOString();
      await db.saveTree(tree);

      return { success: true };
    } catch (error) {
      console.error("Error deleting node:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateNodePosition(
    nodeId: string,
    position: { x: number; y: number },
    tree: ChatTree,
    treeId: string
  ): Promise<void> {
    const node = tree.nodes[nodeId];
    if (!node) return;

    node.customPosition = position;
    node.updatedAt = new Date().toISOString();

    await db.saveNode(node, treeId);
    await db.saveTree(tree);
  }

  async reparentNode(
    nodeId: string,
    newParentId: string,
    tree: ChatTree,
    treeId: string
  ): Promise<boolean> {
    const node = tree.nodes[nodeId];
    const newParent = tree.nodes[newParentId];

    if (!node || !newParent) return false;

    // Prevent circular dependencies
    if (this.wouldCreateCycle(nodeId, newParentId, tree)) {
      return false;
    }

    // Prevent making node its own parent or root
    if (nodeId === newParentId || nodeId === tree.rootNodeId) {
      return false;
    }

    // Remove from old parent
    if (node.parentId && tree.nodes[node.parentId]) {
      const oldParent = tree.nodes[node.parentId];
      oldParent.children = oldParent.children.filter((id) => id !== nodeId);
    }

    // Add to new parent
    node.parentId = newParentId;
    newParent.children.push(nodeId);

    await db.saveTree(tree);
    await db.saveNode(node, treeId);

    return true;
  }

  private wouldCreateCycle(
    nodeId: string,
    newParentId: string,
    tree: ChatTree
  ): boolean {
    let current = newParentId;
    const visited = new Set<string>();

    while (current) {
      if (current === nodeId) return true;
      if (visited.has(current)) return false;

      visited.add(current);
      const node = tree.nodes[current];
      current = node?.parentId || "";
    }

    return false;
  }

  async renameNode(
    nodeId: string,
    newTitle: string,
    tree: ChatTree,
    treeId: string
  ): Promise<void> {
    const node = tree.nodes[nodeId];
    if (!node) return;

    node.title = newTitle;
    node.updatedAt = new Date().toISOString();

    await db.saveNode(node, treeId);
    await db.saveTree(tree);
  }

  async updateNodeColor(
    nodeId: string,
    color: string,
    tree: ChatTree,
    treeId: string
  ): Promise<void> {
    const node = tree.nodes[nodeId];
    if (!node) return;

    node.color = color;
    node.updatedAt = new Date().toISOString();

    await db.saveNode(node, treeId);
  }

  async updateNodeShape(
    nodeId: string,
    shape: string,
    tree: ChatTree,
    treeId: string
  ): Promise<void> {
    const node = tree.nodes[nodeId];
    if (!node) return;

    // Validate shape
    const validShapes = ["rectangle", "circle", "rounded", "diamond"];
    if (validShapes.includes(shape)) {
      node.shape = shape as "rectangle" | "circle" | "rounded" | "diamond";
      node.updatedAt = new Date().toISOString();
      await db.saveNode(node, treeId);
    }
  }
}
