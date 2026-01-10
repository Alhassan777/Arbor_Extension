// IndexedDB wrapper for persistent storage
import { ChatNode, ChatTree, ExtensionState } from '../types';

const DB_NAME = 'ArborDB';
const DB_VERSION = 1;

class ArborDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

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

        // Create object stores
        if (!db.objectStoreNames.contains('trees')) {
          db.createObjectStore('trees', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('nodes')) {
          const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
          nodeStore.createIndex('treeId', 'treeId', { unique: false });
          nodeStore.createIndex('url', 'url', { unique: false });
        }

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
}

// Singleton instance
export const db = new ArborDatabase();
