import type { ChatTree, ChatNode, ConnectionType } from "../../types";
import { db } from "../db";
import { ConnectionLabelDialog } from "./ConnectionLabelDialog";

export class ConnectionLabelsManager {
  async editConnectionLabel(
    childNodeId: string,
    parentNodeId: string,
    tree: ChatTree,
    treeId: string,
    onSuccess: (parentTitle: string, childTitle: string) => void
  ): Promise<void> {
    const childNode = tree.nodes[childNodeId];
    const parentNode = tree.nodes[parentNodeId];

    if (!childNode || !parentNode) return;

    // Show custom dialog instead of browser prompt
    const label = await ConnectionLabelDialog.show({
      parentTitle: parentNode.title,
      childTitle: childNode.title,
      currentLabel: childNode.connectionLabel || null,
      allowCustom: true,
    });

    if (!label) return;

    childNode.connectionLabel = label as ConnectionType;
    await db.saveTree(tree);
    await db.saveNode(childNode, treeId);

    onSuccess(parentNode.title, childNode.title);
  }
}
