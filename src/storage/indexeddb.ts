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

  // Tree operations
  async saveTree(tree: ChatTree): Promise<void> {
    const transaction = this.db!.transaction(['trees'], 'readwrite');
    const store = transaction.objectStore('trees');
    await this.promisify(store.put(tree));
  }

  // Batch save tree (queued)
  saveTreeBatched(tree: ChatTree): void {
    this.writeQueue.push({ type: 'tree', data: tree });
    this.scheduleFlush();
  }

  async getTree(treeId: string): Promise<ChatTree | null> {
    const transaction = this.db!.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');
    const tree = await this.promisify<ChatTree>(store.get(treeId));
    return tree || null;
  }

  async getAllTrees(): Promise<ChatTree[]> {
    const transaction = this.db!.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');
    return await this.promisify<ChatTree[]>(store.getAll());
  }

  async deleteTree(treeId: string): Promise<void> {
    const transaction = this.db!.transaction(['trees'], 'readwrite');
    const store = transaction.objectStore('trees');
    await this.promisify(store.delete(treeId));
  }

  // Node operations
  async saveNode(node: ChatNode, treeId: string): Promise<void> {
    const transaction = this.db!.transaction(['nodes'], 'readwrite');
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
      console.warn("🌳 Arbor: Failed to get state from database:", error);
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
}

// Singleton instance
export const db = new ArborDatabase();
