/**
 * ClassyVision Client-Side Model Definitions
 * 
 * Defines model configurations for browser-based inference.
 * All models are pre-trained and converted to ONNX format.
 */

export interface ModelConfig {
  name: string
  path: string
  inputSize: [number, number] // [width, height]
  mean: number[]
  std: number[]
  numClasses?: number
  description: string
}

export interface ModelMetadata {
  version: string
  framework: 'onnx'
  quantized: boolean
  size: number // in bytes
  accuracy?: number
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ImageNet pre-trained ResNet50 for image classification
  imagenet_resnet50: {
    name: 'imagenet-resnet50',
    path: '/models/imagenet-resnet50.onnx',
    inputSize: [224, 224],
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
    numClasses: 1000,
    description: 'ResNet50 pre-trained on ImageNet for general image classification'
  },

  // Video classification model (adapted from ClassyVision)
  video_classifier: {
    name: 'video-classifier',
    path: '/models/video-classifier.onnx',
    inputSize: [224, 224],
    mean: [0.45, 0.45, 0.45],
    std: [0.225, 0.225, 0.225],
    numClasses: 400, // Kinetics-400 classes
    description: 'Video classification model for categorizing video content'
  },

  // Feature extraction model (embeddings)
  feature_extractor: {
    name: 'feature-extractor',
    path: '/models/feature-extractor.onnx',
    inputSize: [224, 224],
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
    description: 'Feature extraction model for generating video embeddings'
  },

  // Content moderation model
  moderation_classifier: {
    name: 'moderation-classifier',
    path: '/models/moderation-classifier.onnx',
    inputSize: [224, 224],
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
    numClasses: 2, // [safe, unsafe]
    description: 'Content moderation model for detecting inappropriate content'
  }
}

export const IMAGENET_CLASSES: Record<number, string> = {
  // Top 100 ImageNet classes (abbreviated for space)
  // In production, load full class list from a JSON file
  0: 'tench',
  1: 'goldfish',
  2: 'great white shark',
  // ... (full list would be loaded from external file)
}

export const VIDEO_CATEGORIES: Record<number, string> = {
  // Video categories (example - would match your dataset)
  0: 'dancing',
  1: 'cooking',
  2: 'gaming',
  3: 'music',
  4: 'comedy',
  5: 'education',
  6: 'sports',
  7: 'travel',
  // ... (full list would match your training data)
}

export interface ModelInfo {
  config: ModelConfig
  metadata: ModelMetadata
  loaded: boolean
  session?: any // ONNX session
}

export class ModelRegistry {
  private models: Map<string, ModelInfo> = new Map()

  registerModel(name: string, config: ModelConfig, metadata: ModelMetadata): void {
    this.models.set(name, {
      config,
      metadata,
      loaded: false
    })
  }

  getModel(name: string): ModelInfo | undefined {
    return this.models.get(name)
  }

  getAllModels(): ModelInfo[] {
    return Array.from(this.models.values())
  }

  setModelLoaded(name: string, session: any): void {
    const model = this.models.get(name)
    if (model) {
      model.loaded = true
      model.session = session
    }
  }

  isModelLoaded(name: string): boolean {
    const model = this.models.get(name)
    return model?.loaded || false
  }
}

// Global model registry
export const modelRegistry = new ModelRegistry()

// Initialize registry with default models
Object.entries(MODEL_CONFIGS).forEach(([key, config]) => {
  modelRegistry.registerModel(key, config, {
    version: '1.0.0',
    framework: 'onnx',
    quantized: true,
    size: 0 // Will be updated when model is loaded
  })
})

