/**
 * Model Loader and Cache Manager
 * 
 * Handles loading ONNX models, caching in IndexedDB, and lazy loading.
 */

import * as ort from 'onnxruntime-web'
import { ModelInfo, modelRegistry } from './client-models'

export interface LoadOptions {
  useCache?: boolean
  quantized?: boolean
  executionProviders?: string[]
}

export class ModelLoader {
  private cache: Map<string, ort.InferenceSession> = new Map()
  private loadingPromises: Map<string, Promise<ort.InferenceSession>> = new Map()
  private indexedDBCache: IDBDatabase | null = null
  private readonly DB_NAME = 'oxygen_models'
  private readonly DB_VERSION = 1

  constructor() {
    this.initIndexedDB().catch(console.error)
  }

  /**
   * Initialize IndexedDB for model caching
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.indexedDBCache = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'name' })
        }
      }
    })
  }

  /**
   * Load model from cache or network
   */
  async loadModel(
    modelName: string,
    options: LoadOptions = {}
  ): Promise<ort.InferenceSession> {
    const {
      useCache = true,
      quantized = true,
      executionProviders = ['webgl', 'cpu']
    } = options

    // Check memory cache first
    if (this.cache.has(modelName)) {
      return this.cache.get(modelName)!
    }

    // Check if already loading
    if (this.loadingPromises.has(modelName)) {
      return this.loadingPromises.get(modelName)!
    }

    // Start loading
    const loadPromise = this.loadModelInternal(modelName, useCache, quantized, executionProviders)
    this.loadingPromises.set(modelName, loadPromise)

    try {
      const session = await loadPromise
      this.cache.set(modelName, session)
      this.loadingPromises.delete(modelName)
      return session
    } catch (error) {
      this.loadingPromises.delete(modelName)
      throw error
    }
  }

  /**
   * Internal model loading logic
   */
  private async loadModelInternal(
    modelName: string,
    useCache: boolean,
    quantized: boolean,
    executionProviders: string[]
  ): Promise<ort.InferenceSession> {
    const modelInfo = modelRegistry.getModel(modelName)
    if (!modelInfo) {
      throw new Error(`Model ${modelName} not found in registry`)
    }

    // Try IndexedDB cache first
    if (useCache && this.indexedDBCache) {
      const cached = await this.loadFromIndexedDB(modelName)
      if (cached) {
        try {
          const session = await ort.InferenceSession.create(cached, {
            executionProviders
          })
          modelRegistry.setModelLoaded(modelName, session)
          return session
        } catch (error) {
          console.warn(`Failed to load cached model ${modelName}, fetching from network:`, error)
        }
      }
    }

    // Load from network
    const modelPath = modelInfo.config.path
    const response = await fetch(modelPath)
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Create inference session
    const session = await ort.InferenceSession.create(uint8Array, {
      executionProviders
    })

    // Cache in IndexedDB
    if (useCache && this.indexedDBCache) {
      await this.saveToIndexedDB(modelName, uint8Array)
    }

    // Update registry
    modelRegistry.setModelLoaded(modelName, session)

    return session
  }

  /**
   * Load model from IndexedDB
   */
  private async loadFromIndexedDB(modelName: string): Promise<Uint8Array | null> {
    if (!this.indexedDBCache) return null

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDBCache!.transaction(['models'], 'readonly')
      const store = transaction.objectStore('models')
      const request = store.get(modelName)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save model to IndexedDB
   */
  private async saveToIndexedDB(modelName: string, data: Uint8Array): Promise<void> {
    if (!this.indexedDBCache) return

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDBCache!.transaction(['models'], 'readwrite')
      const store = transaction.objectStore('models')
      const request = store.put({
        name: modelName,
        data: data,
        timestamp: Date.now()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Preload models (for faster inference later)
   */
  async preloadModels(modelNames: string[]): Promise<void> {
    const promises = modelNames.map(name => 
      this.loadModel(name).catch(err => {
        console.warn(`Failed to preload model ${name}:`, err)
      })
    )
    await Promise.allSettled(promises)
  }

  /**
   * Unload model from memory
   */
  unloadModel(modelName: string): void {
    this.cache.delete(modelName)
    const modelInfo = modelRegistry.getModel(modelName)
    if (modelInfo) {
      modelInfo.loaded = false
      modelInfo.session = undefined
    }
  }

  /**
   * Clear all cached models
   */
  async clearCache(): Promise<void> {
    this.cache.clear()
    
    if (this.indexedDBCache) {
      return new Promise((resolve, reject) => {
        const transaction = this.indexedDBCache!.transaction(['models'], 'readwrite')
        const store = transaction.objectStore('models')
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    if (!this.indexedDBCache) return 0

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDBCache!.transaction(['models'], 'readonly')
      const store = transaction.objectStore('models')
      const request = store.getAll()

      request.onsuccess = () => {
        let totalSize = 0
        request.result.forEach((item: any) => {
          totalSize += item.data.byteLength
        })
        resolve(totalSize)
      }

      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
let modelLoaderInstance: ModelLoader | null = null

export function getModelLoader(): ModelLoader {
  if (!modelLoaderInstance) {
    modelLoaderInstance = new ModelLoader()
  }
  return modelLoaderInstance
}




