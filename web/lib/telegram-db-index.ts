/**
 * Telegram Database Indexing System
 * 
 * Creates and maintains indexes for fast lookups.
 * Indexes are stored as separate files in Telegram.
 */

import { TelegramDatabase } from './telegram-db'
import { TelegramStorage } from './telegram-storage'

export interface IndexEntry {
  key: string
  value: string // Record ID
}

export interface Index {
  table: string
  field: string
  entries: IndexEntry[]
  updatedAt: number
}

export class TelegramDBIndex {
  private db: TelegramDatabase
  private storage: TelegramStorage
  private indexCache: Map<string, Index> = new Map()

  constructor(db: TelegramDatabase, storage: TelegramStorage) {
    this.db = db
    this.storage = storage
  }

  /**
   * Get index file name
   */
  private getIndexFileName(table: string, field: string): string {
    return `db_index_${table}_${field}.json`
  }

  /**
   * Load index from Telegram storage
   */
  private async loadIndex(table: string, field: string): Promise<Index | null> {
    const cacheKey = `${table}_${field}`
    
    // Check cache
    if (this.indexCache.has(cacheKey)) {
      return this.indexCache.get(cacheKey)!
    }

    try {
      const fileName = this.getIndexFileName(table, field)
      const data = await this.storage.downloadFile(fileName)
      
      if (!data) {
        return null
      }

      const index: Index = JSON.parse(data.toString())
      this.indexCache.set(cacheKey, index)
      return index
    } catch (error) {
      console.error(`Error loading index ${table}.${field}:`, error)
      return null
    }
  }

  /**
   * Save index to Telegram storage
   */
  private async saveIndex(index: Index): Promise<void> {
    const fileName = this.getIndexFileName(index.table, index.field)
    const data = JSON.stringify(index, null, 2)
    const buffer = Buffer.from(data, 'utf-8')
    
    await this.storage.uploadDatabaseFile(fileName, buffer, {
      mimeType: 'application/json',
      description: `Index: ${index.table}.${index.field}`
    })

    // Update cache
    const cacheKey = `${index.table}_${index.field}`
    this.indexCache.set(cacheKey, index)
  }

  /**
   * Create or update an index for a table field
   */
  async createIndex(table: string, field: string): Promise<void> {
    // Load all records from the table
    const records = await this.db.read(table)
    
    // Build index entries
    const entries: IndexEntry[] = records.map(record => ({
      key: String(record[field] || ''),
      value: record.id
    }))

    // Sort by key for faster lookups
    entries.sort((a, b) => {
      if (a.key < b.key) return -1
      if (a.key > b.key) return 1
      return 0
    })

    const index: Index = {
      table,
      field,
      entries,
      updatedAt: Date.now()
    }

    await this.saveIndex(index)
  }

  /**
   * Add entry to index
   */
  async addToIndex(table: string, field: string, key: string, recordId: string): Promise<void> {
    let index = await this.loadIndex(table, field)
    
    if (!index) {
      // Create new index
      index = {
        table,
        field,
        entries: [],
        updatedAt: Date.now()
      }
    }

    // Check if entry already exists
    const existingIndex = index.entries.findIndex(e => e.key === key && e.value === recordId)
    if (existingIndex === -1) {
      index.entries.push({ key, value: recordId })
      // Keep sorted
      index.entries.sort((a, b) => {
        if (a.key < b.key) return -1
        if (a.key > b.key) return 1
        return 0
      })
      index.updatedAt = Date.now()
      await this.saveIndex(index)
    }
  }

  /**
   * Remove entry from index
   */
  async removeFromIndex(table: string, field: string, key: string, recordId: string): Promise<void> {
    const index = await this.loadIndex(table, field)
    
    if (!index) return

    const entryIndex = index.entries.findIndex(e => e.key === key && e.value === recordId)
    if (entryIndex !== -1) {
      index.entries.splice(entryIndex, 1)
      index.updatedAt = Date.now()
      await this.saveIndex(index)
    }
  }

  /**
   * Find record IDs by indexed key
   */
  async findByIndex(table: string, field: string, key: string): Promise<string[]> {
    const index = await this.loadIndex(table, field)
    
    if (!index) {
      // Index doesn't exist, return empty
      return []
    }

    // Binary search for the key
    const results: string[] = []
    for (const entry of index.entries) {
      if (entry.key === key) {
        results.push(entry.value)
      } else if (entry.key > key) {
        // Since sorted, we can break early
        break
      }
    }

    return results
  }

  /**
   * Find record IDs by indexed key range
   */
  async findByIndexRange(
    table: string,
    field: string,
    minKey: string,
    maxKey: string
  ): Promise<string[]> {
    const index = await this.loadIndex(table, field)
    
    if (!index) {
      return []
    }

    const results: string[] = []
    for (const entry of index.entries) {
      if (entry.key >= minKey && entry.key <= maxKey) {
        results.push(entry.value)
      } else if (entry.key > maxKey) {
        break
      }
    }

    return results
  }

  /**
   * Rebuild all indexes for a table
   */
  async rebuildIndexes(table: string, fields: string[]): Promise<void> {
    for (const field of fields) {
      await this.createIndex(table, field)
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(table: string, field: string): Promise<{ entries: number; size: number } | null> {
    const index = await this.loadIndex(table, field)
    
    if (!index) {
      return null
    }

    const data = JSON.stringify(index)
    return {
      entries: index.entries.length,
      size: Buffer.byteLength(data, 'utf-8')
    }
  }

  /**
   * Clear index cache
   */
  clearCache(): void {
    this.indexCache.clear()
  }
}

// Helper function to get index instance
export function getDBIndex(): TelegramDBIndex {
  const { getTelegramDatabase } = require('./telegram-db')
  const { getTelegramStorage } = require('./telegram-storage')
  const db = getTelegramDatabase()
  const storage = getTelegramStorage()
  return new TelegramDBIndex(db, storage)
}


