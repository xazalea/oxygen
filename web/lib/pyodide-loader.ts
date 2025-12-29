import { loadPyodide, PyodideInterface } from 'pyodide'

let pyodideInstance: PyodideInterface | null = null
let isLoading = false
let loadPromise: Promise<PyodideInterface> | null = null

export async function loadPyodideInstance(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return pyodideInstance
  }

  if (loadPromise) {
    return loadPromise
  }

  isLoading = true
  loadPromise = (async () => {
    try {
      // Load Pyodide from CDN
      const pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      })

      // Install numpy (included in Pyodide)
      await pyodide.loadPackage('numpy')

      pyodideInstance = pyodide
      isLoading = false
      return pyodide
    } catch (error) {
      isLoading = false
      loadPromise = null
      throw error
    }
  })()

  return loadPromise
}

export function getPyodideInstance(): PyodideInterface | null {
  return pyodideInstance
}

export function isPyodideLoading(): boolean {
  return isLoading
}

