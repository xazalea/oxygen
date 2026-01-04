/**
 * Inference Engine
 * 
 * Core inference engine using ONNX.js for browser-based model execution.
 * Handles tensor operations, batching, and result post-processing.
 */

import * as ort from 'onnxruntime-web'
import { ModelInfo, modelRegistry } from './client-models'
import { getModelLoader } from './model-loader'
import { VideoProcessor, FrameData } from './video-processor'

export interface InferenceOptions {
  batchSize?: number
  topK?: number
  threshold?: number
}

export interface InferenceResult {
  predictions: Array<{
    classIndex: number
    className?: string
    confidence: number
  }>
  embeddings?: Float32Array
  processingTime: number
}

export class InferenceEngine {
  private modelLoader = getModelLoader()
  private videoProcessor = new VideoProcessor()

  /**
   * Run inference on a single image
   */
  async inferImage(
    modelName: string,
    imageData: ImageData,
    options: InferenceOptions = {}
  ): Promise<InferenceResult> {
    const startTime = performance.now()

    // Load model
    const session = await this.modelLoader.loadModel(modelName)
    const modelInfo = modelRegistry.getModel(modelName)
    if (!modelInfo) {
      throw new Error(`Model ${modelName} not found`)
    }

    // Preprocess image
    const { config } = modelInfo
    const tensor = this.videoProcessor.preprocessFrame(
      imageData,
      config.mean,
      config.std
    )

    // Create ONNX tensor
    const inputTensor = new ort.Tensor(
      'float32',
      tensor,
      [1, 3, config.inputSize[1], config.inputSize[0]] // [batch, channels, height, width]
    )

    // Run inference
    const feeds = { [session.inputNames[0]]: inputTensor }
    const results = await session.run(feeds)

    // Get output
    const outputName = session.outputNames[0]
    const output = results[outputName] as ort.Tensor

    // Post-process results
    const predictions = this.postProcessOutput(
      output.data as Float32Array,
      options
    )

    const processingTime = performance.now() - startTime

    return {
      predictions,
      processingTime
    }
  }

  /**
   * Run inference on video frames
   */
  async inferVideo(
    modelName: string,
    frames: FrameData[],
    options: InferenceOptions = {}
  ): Promise<InferenceResult[]> {
    const { batchSize = 4 } = options
    const results: InferenceResult[] = []

    // Process in batches
    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize)
      const batchResult = await this.inferBatch(modelName, batch, options)
      results.push(...batchResult)
    }

    return results
  }

  /**
   * Run inference on a batch of frames
   */
  private async inferBatch(
    modelName: string,
    frames: FrameData[],
    options: InferenceOptions = {}
  ): Promise<InferenceResult[]> {
    const startTime = performance.now()

    // Load model
    const session = await this.modelLoader.loadModel(modelName)
    const modelInfo = modelRegistry.getModel(modelName)
    if (!modelInfo) {
      throw new Error(`Model ${modelName} not found`)
    }

    // Preprocess batch
    const { config } = modelInfo
    const tensor = this.videoProcessor.preprocessBatch(
      frames,
      config.mean,
      config.std
    )

    // Create ONNX tensor
    const inputTensor = new ort.Tensor(
      'float32',
      tensor,
      [frames.length, 3, config.inputSize[1], config.inputSize[0]]
    )

    // Run inference
    const feeds = { [session.inputNames[0]]: inputTensor }
    const results = await session.run(feeds)

    // Get output
    const outputName = session.outputNames[0]
    const output = results[outputName] as ort.Tensor
    const outputData = output.data as Float32Array

    // Post-process each frame in batch
    const batchResults: InferenceResult[] = []
    const numClasses = output.dims[output.dims.length - 1]
    const frameSize = numClasses

    for (let i = 0; i < frames.length; i++) {
      const frameOutput = outputData.slice(i * frameSize, (i + 1) * frameSize)
      const predictions = this.postProcessOutput(frameOutput, options)
      
      batchResults.push({
        predictions,
        processingTime: performance.now() - startTime
      })
    }

    return batchResults
  }

  /**
   * Extract features/embeddings from image
   */
  async extractFeatures(
    modelName: string,
    imageData: ImageData
  ): Promise<Float32Array> {
    // Load model
    const session = await this.modelLoader.loadModel(modelName)
    const modelInfo = modelRegistry.getModel(modelName)
    if (!modelInfo) {
      throw new Error(`Model ${modelName} not found`)
    }

    // Preprocess image
    const { config } = modelInfo
    const tensor = this.videoProcessor.preprocessFrame(
      imageData,
      config.mean,
      config.std
    )

    // Create ONNX tensor
    const inputTensor = new ort.Tensor(
      'float32',
      tensor,
      [1, 3, config.inputSize[1], config.inputSize[0]]
    )

    // Run inference
    const feeds = { [session.inputNames[0]]: inputTensor }
    const results = await session.run(feeds)

    // Get embedding output (usually the last layer before classification)
    const outputName = session.outputNames[0]
    const output = results[outputName] as ort.Tensor

    // Return as Float32Array
    return new Float32Array(output.data as ArrayBuffer)
  }

  /**
   * Post-process model output to get predictions
   */
  private postProcessOutput(
    output: Float32Array,
    options: InferenceOptions = {}
  ): Array<{ classIndex: number; confidence: number }> {
    const { topK = 5, threshold = 0.1 } = options

    // Apply softmax if needed (assuming logits)
    const probabilities = this.softmax(output)

    // Get top K predictions
    const indexed = probabilities.map((prob, idx) => ({
      classIndex: idx,
      confidence: prob
    }))

    // Sort by confidence
    indexed.sort((a, b) => b.confidence - a.confidence)

    // Filter by threshold and take top K
    return indexed
      .filter(p => p.confidence >= threshold)
      .slice(0, topK)
  }

  /**
   * Apply softmax to logits
   */
  private softmax(logits: Float32Array): Float32Array {
    const max = Math.max(...Array.from(logits))
    const exp = logits.map(x => Math.exp(x - max))
    const sum = exp.reduce((a, b) => a + b, 0)
    return exp.map(x => x / sum) as Float32Array
  }
}

// Singleton instance
let inferenceEngineInstance: InferenceEngine | null = null

export function getInferenceEngine(): InferenceEngine {
  if (!inferenceEngineInstance) {
    inferenceEngineInstance = new InferenceEngine()
  }
  return inferenceEngineInstance
}



