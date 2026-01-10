import { db } from "../db";
import type { ExtensionState, ChatTree } from "../../types";

export class StateManager {
  async loadState(): Promise<Partial<ExtensionState>> {
    const savedState = await db.getState();
    return {
      currentTreeId: (savedState.currentTreeId as string) || null,
      currentNodeId: (savedState.currentNodeId as string) || null,
    };
  }

  async saveState(state: {
    currentTreeId: string | null;
    currentNodeId: string | null;
  }) {
    await db.saveState({
      currentTreeId: state.currentTreeId,
      currentNodeId: state.currentNodeId,
    });
  }

  async loadTrees(): Promise<Record<string, ChatTree>> {
    const treesArray = await db.getAllTrees();

    // Convert array to Record<string, ChatTree>
    const treesRecord: Record<string, ChatTree> = {};
    treesArray.forEach((tree) => {
      treesRecord[tree.id] = tree;
    });

    return treesRecord;
  }
}
