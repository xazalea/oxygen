/**
 * Telegram Database Abstraction Layer
 * 
 * Provides a database-like interface over Telegram Cloud Storage.
 * Each table is stored as a structured JSON/BSON file in Telegram.
 * 
 * Inspired by:
 * - TFile: https://github.com/DevAdalat/TFile
 * - pg-telegram-backuper: https://github.com/m-hoseyny/pg-telegram-backuper
 */

import { TelegramStorage } from './telegram-storage'

export interface TableRecord {
  id: string
  [key: string]: any
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  where?: Record<string, any>
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete'
  table: string
  data?: any
  id?: string
}

export class TelegramDatabase {
  private storage: TelegramStorage
  private cache: Map<string, any> = new Map()
  private cacheTimeout: number = 5 * 60 * 1000 // 5 minutes
  private cacheTimestamps: Map<string, number> = new Map()

  constructor(storage: TelegramStorage) {
    this.storage = storage
  }

  /**
   * Get table file name for a given table
   */
  private getTableFileName(table: string): string {
    return `db_${table}.json`
  }

  /**
   * Get index file name for a given table and field
   */
  private getIndexFileName(table: string, field: string): string {
    return `db_${table}_${field}_index.json`
  }

  /**
   * Load table data from Telegram storage
   */
  private async loadTable(table: string): Promise<TableRecord[]> {
    const cacheKey = `table_${table}`
    const now = Date.now()
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const timestamp = this.cacheTimestamps.get(cacheKey) || 0
      if (now - timestamp < this.cacheTimeout) {
        return this.cache.get(cacheKey)
      }
    }

    try {
      const fileName = this.getTableFileName(table)
      const data = await this.storage.downloadFile(fileName)
      
      if (!data) {
        // Table doesn't exist yet, return empty array
        const empty: TableRecord[] = []
        this.cache.set(cacheKey, empty)
        this.cacheTimestamps.set(cacheKey, now)
        return empty
      }

      const records: TableRecord[] = JSON.parse(data.toString())
      
      // Update cache
      this.cache.set(cacheKey, records)
      this.cacheTimestamps.set(cacheKey, now)
      
      return records
    } catch (error) {
      console.error(`Error loading table ${table}:`, error)
      return []
    }
  }

  /**
   * Save table data to Telegram storage
   */
  private async saveTable(table: string, records: TableRecord[]): Promise<void> {
    const fileName = this.getTableFileName(table)
    const data = JSON.stringify(records, null, 2)
    const buffer = Buffer.from(data, 'utf-8')
    
    await this.storage.uploadFile(fileName, buffer, {
      mimeType: 'application/json',
      description: `Database table: ${table}`
    })

    // Update cache
    const cacheKey = `table_${table}`
    this.cache.set(cacheKey, records)
    this.cacheTimestamps.set(cacheKey, Date.now())
  }

  /**
   * Generate unique ID for a record
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create a new record in a table
   */
  async create(table: string, data: Omit<TableRecord, 'id'>): Promise<TableRecord> {
    const records = await this.loadTable(table)
    const record: TableRecord = {
      id: this.generateId(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    records.push(record)
    await this.saveTable(table, records)
    
    return record
  }

  /**
   * Read records from a table with optional query
   */
  async read(table: string, options?: QueryOptions): Promise<TableRecord[]> {
    let records = await this.loadTable(table)

    // Apply where filters
    if (options?.where) {
      records = records.filter(record => {
        return Object.entries(options.where!).every(([key, value]) => {
          // Support MongoDB-style operators
          if (value && typeof value === 'object') {
            if ('$gt' in value) {
              return record[key] > value.$gt
            }
            if ('$lt' in value) {
              return record[key] < value.$lt
            }
            if ('$gte' in value) {
              return record[key] >= value.$gte
            }
            if ('$lte' in value) {
              return record[key] <= value.$lte
            }
            if ('$ne' in value) {
              return record[key] !== value.$ne
            }
            if ('$in' in value && Array.isArray(value.$in)) {
              return value.$in.includes(record[key])
            }
          }
          // Simple equality check
          return record[key] === value
        })
      })
    }

    // Apply sorting
    if (options?.orderBy) {
      const direction = options.orderDirection || 'asc'
      records.sort((a, b) => {
        const aVal = a[options.orderBy!]
        const bVal = b[options.orderBy!]
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1
        if (aVal > bVal) return direction === 'asc' ? 1 : -1
        return 0
      })
    }

    // Apply pagination
    if (options?.offset) {
      records = records.slice(options.offset)
    }
    if (options?.limit) {
      records = records.slice(0, options.limit)
    }

    return records
  }

  /**
   * Find a single record by ID
   */
  async findById(table: string, id: string): Promise<TableRecord | null> {
    const records = await this.loadTable(table)
    return records.find(r => r.id === id) || null
  }

  /**
   * Update a record in a table
   */
  async update(table: string, id: string, data: Partial<TableRecord>): Promise<TableRecord | null> {
    const records = await this.loadTable(table)
    const index = records.findIndex(r => r.id === id)
    
    if (index === -1) {
      return null
    }

    records[index] = {
      ...records[index],
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: Date.now()
    }

    await this.saveTable(table, records)
    return records[index]
  }

  /**
   * Delete a record from a table
   */
  async delete(table: string, id: string): Promise<boolean> {
    const records = await this.loadTable(table)
    const index = records.findIndex(r => r.id === id)
    
    if (index === -1) {
      return false
    }

    records.splice(index, 1)
    await this.saveTable(table, records)
    return true
  }

  /**
   * Execute batch operations
   */
  async batch(operations: BatchOperation[]): Promise<void> {
    // Group operations by table
    const tableOps = new Map<string, BatchOperation[]>()
    
    for (const op of operations) {
      if (!tableOps.has(op.table)) {
        tableOps.set(op.table, [])
      }
      tableOps.get(op.table)!.push(op)
    }

    // Process each table's operations
    for (const [table, ops] of tableOps.entries()) {
      const records = await this.loadTable(table)
      
      for (const op of ops) {
        if (op.type === 'create' && op.data) {
          const record: TableRecord = {
            id: this.generateId(),
            ...op.data,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
          records.push(record)
        } else if (op.type === 'update' && op.id && op.data) {
          const index = records.findIndex(r => r.id === op.id)
          if (index !== -1) {
            records[index] = {
              ...records[index],
              ...op.data,
              id: op.id,
              updatedAt: Date.now()
            }
          }
        } else if (op.type === 'delete' && op.id) {
          const index = records.findIndex(r => r.id === op.id)
          if (index !== -1) {
            records.splice(index, 1)
          }
        }
      }
      
      await this.saveTable(table, records)
    }
  }

  /**
   * Clear cache for a specific table
   */
  clearCache(table?: string): void {
    if (table) {
      const cacheKey = `table_${table}`
      this.cache.delete(cacheKey)
      this.cacheTimestamps.delete(cacheKey)
    } else {
      this.cache.clear()
      this.cacheTimestamps.clear()
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(table: string): Promise<{ count: number; size: number }> {
    const records = await this.loadTable(table)
    const data = JSON.stringify(records)
    return {
      count: records.length,
      size: Buffer.byteLength(data, 'utf-8')
    }
  }
}

// Singleton instance
let dbInstance: TelegramDatabase | null = null

export function getTelegramDatabase(): TelegramDatabase {
  if (!dbInstance) {
    const { TelegramStorage } = require('./telegram-storage')
    const storage = new TelegramStorage()
    dbInstance = new TelegramDatabase(storage)
  }
  return dbInstance
}

