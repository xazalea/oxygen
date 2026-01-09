/**
 * Pyodide Bridge for ClassyVision
 * 
 * Optional bridge for running additional Python-based processing if needed.
 * Primary inference uses ONNX.js, but this can handle preprocessing/postprocessing.
 */

import { loadPyodideInstance } from '../pyodide-loader'

export class ClassyVisionPyodideBridge {
  private pyodide: any = null
  private isInitialized = false

  /**
   * Initialize Pyodide (optional, only if needed)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.pyodide = await loadPyodideInstance()
      
      // Install any required packages
      await this.pyodide.loadPackage(['numpy', 'PIL'])
      
      this.isInitialized = true
    } catch (error) {
      console.warn('Pyodide initialization failed, continuing without it:', error)
      // Not critical - ONNX.js handles most inference
    }
  }

  /**
   * Preprocess image using Python (if needed)
   * Most preprocessing is done in JavaScript for performance
   */
  async preprocessImage(imageData: ImageData): Promise<Float32Array> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.pyodide) {
      throw new Error('Pyodide not available')
    }

    // Convert ImageData to numpy array
    const code = `
import numpy as np
from js import imageData

# Convert ImageData to numpy array
data = np.frombuffer(imageData.data, dtype=np.uint8)
data = data.reshape((imageData.height, imageData.width, 4))  # RGBA
rgb = data[:, :, :3]  # Remove alpha channel

# Normalize
rgb = rgb.astype(np.float32) / 255.0
mean = np.array([0.485, 0.456, 0.406])
std = np.array([0.229, 0.224, 0.225])
rgb = (rgb - mean) / std

# Convert to CHW format
rgb = rgb.transpose(2, 0, 1)
rgb.flatten().tolist()
`

    this.pyodide.runPython(`
import numpy as np
from js import imageData
`)

    const result = this.pyodide.runPython(code)
    return new Float32Array(result)
  }

  /**
   * Post-process model output (if needed)
   */
  async postProcessOutput(output: Float32Array): Promise<Float32Array> {
    // Most post-processing is done in JavaScript
    // This is here for complex operations if needed
    return output
  }
}

// Singleton instance
let pyodideBridgeInstance: ClassyVisionPyodideBridge | null = null

export function getClassyVisionPyodideBridge(): ClassyVisionPyodideBridge {
  if (!pyodideBridgeInstance) {
    pyodideBridgeInstance = new ClassyVisionPyodideBridge()
  }
  return pyodideBridgeInstance
}




