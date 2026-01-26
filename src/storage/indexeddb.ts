// IndexedDB wrapper for persistent storage
import { ChatNode, ChatTree, ExtensionState } from '../types';

const DB_NAME = 'ArborDB';
const DB_VERSION = 2; // Version 2 - stable schema

class ArborDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  
  // Batch write optimization (currently unused, kept for future use)
  private writeQueue: Array<{ type: 'tree' | 'node', data: any, treeId?: string }> = [];
  private flushTimer: number | null = null;
  private readonly FLUSH_DELAY = 50; // ms - reduced from 100ms

  async init(): Promise<void> {
    // If already initialized, return immediately
    if (this.db) {
      return;
    }

    // If initialization is in progress, return the existing promise
    if (this.initPromise) {
      return this.initPromise;
    }

    
    // Start initialization and store the promise
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        
        // Log current contents
        this.logDatabaseContents();
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create trees store
        if (!db.objectStoreNames.contains('trees')) {
          db.createObjectStore('trees', { keyPath: 'id' });
        }

        // Create nodes store with essential indices only
        let nodeStore: IDBObjectStore;
        if (!db.objectStoreNames.contains('nodes')) {
          nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
          // Add only essential indices
          nodeStore.createIndex('treeId', 'treeId', { unique: false });
          nodeStore.createIndex('url', 'url', { unique: false });
        }

        // Create state store
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  // Helper to log database contents (for debugging)
  private async logDatabaseContents(): Promise<void> {
    try {
      // Check chrome.storage.local
      try {
        const result = await chrome.storage.local.get('arbor_trees');
        const storedTrees = result.arbor_trees || {};
        const treeArray = Object.values(storedTrees) as ChatTree[];
        if (treeArray.length > 0) {
          // Migrate trees to chrome.storage.local if not already there
          // Check IndexedDB
          if (!this.db) return;
          
          const transaction = this.db.transaction(['trees'], 'readonly');
          const store = transaction.objectStore('trees');
          const trees = await this.promisify<ChatTree[]>(store.getAll());
          if (trees.length > 0) {
            await this.migrateTreesToSharedStorage(trees);
          }
        }
      } catch (error) {
        // Silent fail
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Migrate trees from IndexedDB to chrome.storage.local (one-time migration)
  private async migrateTreesToSharedStorage(trees: ChatTree[]): Promise<void> {
    try {
      const result = await chrome.storage.local.get('arbor_trees');
      const storedTrees = result.arbor_trees || {};
      
      let migratedCount = 0;
      let updatedCount = 0;
      
      for (const tree of trees) {
        if (!storedTrees[tree.id]) {
          storedTrees[tree.id] = tree;
          migratedCount++;
        } else {
          // Update existing tree if IndexedDB version is newer
          const existingTree = storedTrees[tree.id];
          if (new Date(tree.updatedAt) > new Date(existingTree.updatedAt)) {
            storedTrees[tree.id] = tree;
            updatedCount++;
          }
        }
      }
      
      if (migratedCount > 0 || updatedCount > 0) {
        await chrome.storage.local.set({ arbor_trees: storedTrees });
      } else {
      }
    } catch (error) {
    }
  }

  // Public method to force migration (useful for debugging)
  async forceMigration(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    if (!this.db) {
      return;
    }
    
    const transaction = this.db.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');
    const trees = await this.promisify<ChatTree[]>(store.getAll());
    
    if (trees.length > 0) {
      await this.migrateTreesToSharedStorage(trees);
    } else {
    }
  }

  // Tree operations
  async saveTree(tree: ChatTree): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    
    // Save to chrome.storage.local (shared across all contexts - content script & extension pages)
    try {
      const result = await chrome.storage.local.get('arbor_trees');
      const trees = result.arbor_trees || {};
      trees[tree.id] = tree;
      await chrome.storage.local.set({ arbor_trees: trees });
    } catch (error) {
    }
    
    // Also save to IndexedDB for backward compatibility
    const transaction = this.db.transaction(['trees'], 'readwrite');
    const store = transaction.objectStore('trees');
    await this.promisify(store.put(tree));
  }

  // Batch save tree (queued)
  saveTreeBatched(tree: ChatTree): void {
    this.writeQueue.push({ type: 'tree', data: tree });
    this.scheduleFlush();
  }

  async getTree(treeId: string): Promise<ChatTree | null> {
    // Try chrome.storage.local first (shared storage)
    try {
      const result = await chrome.storage.local.get('arbor_trees');
      const trees = result.arbor_trees || {};
      if (trees[treeId]) {
        return trees[treeId];
      }
    } catch (error) {
    }
    
    // Fallback to IndexedDB
    const transaction = this.db!.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');
    const tree = await this.promisify<ChatTree>(store.get(treeId));
    return tree || null;
  }

  async getAllTrees(): Promise<ChatTree[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    
    // Try chrome.storage.local first (shared storage)
    try {
      const result = await chrome.storage.local.get('arbor_trees');
      const trees = result.arbor_trees || {};
      const treeArray = Object.values(trees) as ChatTree[];
      if (treeArray.length > 0) {
        return treeArray;
      }
    } catch (error) {
    }
    
    // Fallback to IndexedDB
    const transaction = this.db.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');
    const trees = await this.promisify<ChatTree[]>(store.getAll());
    return trees;
  }

  async deleteTree(treeId: string): Promise<void> {
    // Delete from chrome.storage.local
    try {
      const result = await chrome.storage.local.get('arbor_trees');
      const trees = result.arbor_trees || {};
      delete trees[treeId];
      await chrome.storage.local.set({ arbor_trees: trees });
    } catch (error) {
    }
    
    // Also delete from IndexedDB
    const transaction = this.db!.transaction(['trees'], 'readwrite');
    const store = transaction.objectStore('trees');
    await this.promisify(store.delete(treeId));
  }

  // Node operations
  async saveNode(node: ChatNode, treeId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['nodes'], 'readwrite');
    const store = transaction.objectStore('nodes');
    await this.promisify(store.put({ ...node, treeId }));
  }

  // Batch save node (queued)
  saveNodeBatched(node: ChatNode, treeId: string): void {
    this.writeQueue.push({ type: 'node', data: node, treeId });
    this.scheduleFlush();
  }

  async getNode(nodeId: string): Promise<ChatNode | null> {
    const transaction = this.db!.transaction(['nodes'], 'readonly');
    const store = transaction.objectStore('nodes');
    const node = await this.promisify<ChatNode & { treeId: string }>(store.get(nodeId));
    if (!node) return null;

    // Remove treeId before returning
    const { treeId, ...chatNode } = node;
    return chatNode as ChatNode;
  }

  async getNodesByTree(treeId: string): Promise<ChatNode[]> {
    const transaction = this.db!.transaction(['nodes'], 'readonly');
    const store = transaction.objectStore('nodes');
    const index = store.index('treeId');
    const nodes = await this.promisify<(ChatNode & { treeId: string })[]>(
      index.getAll(treeId)
    );

    // Remove treeId from each node
    return nodes.map(({ treeId, ...node }) => node as ChatNode);
  }

  // Removed unused compound index queries (getNodesByTreeAndPlatform, getRecentNodes)
  // These relied on compound indices that were slowing down writes without providing benefits
  // Can be re-added if needed in the future

  async findNodeByUrl(url: string): Promise<ChatNode | null> {
    const transaction = this.db!.transaction(['nodes'], 'readonly');
    const store = transaction.objectStore('nodes');
    const index = store.index('url');
    const node = await this.promisify<ChatNode & { treeId: string }>(index.get(url));
    if (!node) return null;

    const { treeId, ...chatNode } = node;
    return chatNode as ChatNode;
  }

  async deleteNode(nodeId: string): Promise<void> {
    const transaction = this.db!.transaction(['nodes'], 'readwrite');
    const store = transaction.objectStore('nodes');
    await this.promisify(store.delete(nodeId));
  }

  // State operations
  async saveState(state: Partial<ExtensionState>): Promise<void> {
    if (!this.db) {
      // Database not initialized yet, try to initialize
      await this.init();
    }

    if (!this.db) {
      throw new Error("Database initialization failed");
    }

    const transaction = this.db.transaction(['state'], 'readwrite');
    const store = transaction.objectStore('state');

    for (const [key, value] of Object.entries(state)) {
      await this.promisify(store.put({ key, value }));
    }
  }

  async getState(): Promise<Partial<ExtensionState>> {
    if (!this.db) {
      // Database not initialized yet, try to initialize
      await this.init();
    }

    if (!this.db) {
      // If initialization failed, return empty state
      return {};
    }

    try {
      const transaction = this.db.transaction(['state'], 'readonly');
      const store = transaction.objectStore('state');
      const items = await this.promisify<Array<{ key: string; value: any }>>(
        store.getAll()
      );

      const state: any = {};
      items.forEach(item => {
        state[item.key] = item.value;
      });

      return state;
    } catch (error) {
      // Handle case where transaction fails (e.g., database closed)
      return {};
    }
  }

  // Helper to convert IDBRequest to Promise
  private promisify<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Batch write optimization methods
  private scheduleFlush(): void {
    if (this.flushTimer !== null) {
      return; // Already scheduled
    }

    this.flushTimer = window.setTimeout(() => {
      this.flushWrites().catch(err => {
        console.error('Failed to flush writes:', err);
      });
    }, this.FLUSH_DELAY);
  }

  private async flushWrites(): Promise<void> {
    this.flushTimer = null;

    if (this.writeQueue.length === 0) {
      return;
    }

    // Take current queue and clear it
    const queue = this.writeQueue.slice();
    this.writeQueue = [];

    if (!this.db) {
      console.warn('Database not initialized, skipping flush');
      return;
    }

    try {
      // Group by store type for efficient transactions
      const trees = queue.filter(item => item.type === 'tree');
      const nodes = queue.filter(item => item.type === 'node');

      // Batch write trees
      if (trees.length > 0) {
        // Write to chrome.storage.local (shared storage)
        try {
          const result = await chrome.storage.local.get('arbor_trees');
          const storedTrees = result.arbor_trees || {};
          for (const item of trees) {
            storedTrees[item.data.id] = item.data;
          }
          await chrome.storage.local.set({ arbor_trees: storedTrees });
        } catch (error) {
        }
        
        // Also write to IndexedDB
        const transaction = this.db.transaction(['trees'], 'readwrite');
        const store = transaction.objectStore('trees');
        
        for (const item of trees) {
          store.put(item.data);
        }
        
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      }

      // Batch write nodes
      if (nodes.length > 0) {
        const transaction = this.db.transaction(['nodes'], 'readwrite');
        const store = transaction.objectStore('nodes');
        
        for (const item of nodes) {
          store.put({ ...item.data, treeId: item.treeId });
        }
        
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      }
    } catch (error) {
      console.error('Error during batch flush:', error);
      throw error;
    }
  }

  // Force immediate flush (useful for critical operations)
  async flush(): Promise<void> {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flushWrites();
  }

  // Public method to verify database contents (for debugging)
  async verifyDatabase(): Promise<{
    trees: number;
    nodes: number;
    treeDetails: Array<{ id: string; name: string; nodeCount: number }>;
  }> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction(['trees', 'nodes'], 'readonly');
    const treeStore = transaction.objectStore('trees');
    const nodeStore = transaction.objectStore('nodes');

    const trees = await this.promisify<ChatTree[]>(treeStore.getAll());
    const nodes = await this.promisify<any[]>(nodeStore.getAll());

    const treeDetails = trees.map(tree => ({
      id: tree.id,
      name: tree.name,
      nodeCount: Object.keys(tree.nodes).length
    }));


    return {
      trees: trees.length,
      nodes: nodes.length,
      treeDetails
    };
  }
}

// Singleton instance
export const db = new ArborDatabase();
