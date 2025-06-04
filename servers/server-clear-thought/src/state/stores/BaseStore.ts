/**
 * Base abstract class for all data stores in the Clear Thought MCP server
 * 
 * This class provides common functionality for storing and managing
 * different types of thinking session data.
 */

/**
 * Generic base store for managing collections of typed data
 * @template T - The type of data this store manages
 */
export abstract class BaseStore<T> {
  /** Internal storage map */
  protected data: Map<string, T>;
  
  /** Store name for logging and debugging */
  protected readonly storeName: string;
  
  constructor(storeName: string) {
    this.storeName = storeName;
    this.data = new Map();
  }
  
  /**
   * Add a new item to the store
   * @param id - Unique identifier for the item
   * @param item - The item to store
   */
  abstract add(id: string, item: T): void;
  
  /**
   * Get all items from the store
   * @returns Array of all stored items
   */
  abstract getAll(): T[];
  
  /**
   * Clear all items from the store
   */
  abstract clear(): void;
  
  /**
   * Get a specific item by ID
   * @param id - The item's unique identifier
   * @returns The item if found, undefined otherwise
   */
  get(id: string): T | undefined {
    return this.data.get(id);
  }
  
  /**
   * Check if an item exists
   * @param id - The item's unique identifier
   * @returns True if the item exists
   */
  has(id: string): boolean {
    return this.data.has(id);
  }
  
  /**
   * Delete a specific item
   * @param id - The item's unique identifier
   * @returns True if the item was deleted
   */
  delete(id: string): boolean {
    return this.data.delete(id);
  }
  
  /**
   * Get the number of items in the store
   * @returns The count of items
   */
  size(): number {
    return this.data.size;
  }
  
  /**
   * Export all data for persistence
   * @returns Serializable representation of the store
   */
  export(): Record<string, T> {
    const result: Record<string, T> = {};
    this.data.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  
  /**
   * Import data from a serialized representation
   * @param data - The data to import
   */
  import(data: Record<string, T>): void {
    this.clear();
    Object.entries(data).forEach(([key, value]) => {
      this.add(key, value);
    });
  }
  
  /**
   * Get all keys in the store
   * @returns Array of all keys
   */
  keys(): string[] {
    return Array.from(this.data.keys());
  }
  
  /**
   * Get all values in the store
   * @returns Array of all values
   */
  values(): T[] {
    return Array.from(this.data.values());
  }
  
  /**
   * Iterate over all entries
   * @param callback - Function to call for each entry
   */
  forEach(callback: (value: T, key: string) => void): void {
    this.data.forEach(callback);
  }
  
  /**
   * Filter items based on a predicate
   * @param predicate - Function to test each item
   * @returns Array of items that match the predicate
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.values().filter(predicate);
  }
  
  /**
   * Find the first item matching a predicate
   * @param predicate - Function to test each item
   * @returns The first matching item or undefined
   */
  find(predicate: (item: T) => boolean): T | undefined {
    return this.values().find(predicate);
  }
  
  /**
   * Update an existing item
   * @param id - The item's unique identifier
   * @param updater - Function to update the item
   * @returns True if the item was updated
   */
  update(id: string, updater: (item: T) => T): boolean {
    const item = this.get(id);
    if (item) {
      this.add(id, updater(item));
      return true;
    }
    return false;
  }
}