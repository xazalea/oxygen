import axios from 'axios';
import { AI_MODELS, AIModelKey } from './ai-constants';

// Re-export for convenience if needed, but preferably import from constants
export { AI_MODELS, type AIModelKey };

interface GradioConfig {
  dependencies: Array<{
    id: number;
    inputs: Array<{ type: string; label: string }>;
    outputs: Array<{ type: string; label: string }>;
    api_name?: string;
  }>;
}

async function getGradioConfig(baseUrl: string): Promise<GradioConfig> {
  const response = await axios.get(`${baseUrl}/config`);
  return response.data;
}

export async function generateVideo(modelKey: AIModelKey, prompt: string): Promise<string> {
  const model = AI_MODELS[modelKey];
  if (!model) throw new Error('Invalid model key');

  // Special handling for Fernn AI (non-Gradio)
  if (modelKey === 'vider') {
    try {
      const response = await axios.post(model.url, { prompt });
      // Heuristic for Fernn response
      if (response.data.url) return response.data.url;
      if (response.data.data && typeof response.data.data === 'string' && response.data.data.startsWith('http')) {
        return response.data.data;
      }
      if (response.data.video_url) return response.data.video_url;
      
      // If we get here, log full response to help debug
      console.log('Fernn response:', response.data);
      throw new Error('Unexpected Fernn API response format');
    } catch (error) {
       console.error(`Error generating video with ${modelKey}:`, error);
       throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  try {
    // 1. Fetch config to find the right function index
    const config = await getGradioConfig(model.url);
    
    // 2. Find a dependency that takes text input and outputs video/file
    let fnIndex = -1;
    let apiName = null;

    // Prioritize api_name="predict" or "generate"
    const candidate = config.dependencies.find(d => 
      (d.api_name === 'predict' || d.api_name === 'generate')
    );

    if (candidate) {
      fnIndex = candidate.id;
      apiName = candidate.api_name;
    } else {
      // Fallback: Use the first function.
      fnIndex = config.dependencies[0]?.id ?? 0;
    }
    
    // 3. Call the API
    const predictUrl = `${model.url}/api/predict`;
    const payload: any = {
      data: [prompt],
      fn_index: fnIndex
    };
    
    if (fnIndex !== -1 && config.dependencies) {
      const dep = config.dependencies.find(d => d.id === fnIndex);
      if (dep && dep.inputs.length > 1) {
        // Pad with nulls for extra arguments
        for (let i = 1; i < dep.inputs.length; i++) {
           payload.data.push(null); 
        }
      }
    }

    const response = await axios.post(predictUrl, payload);
    
    if (response.data.data && response.data.data.length > 0) {
      const output = response.data.data[0];
      
      if (typeof output === 'string') {
        if (output.startsWith('/')) {
            return `${model.url}/file=${output}`;
        }
        return output; 
      } else if (output && output.url) {
        return output.url;
      } else if (output && output.name) {
         return `${model.url}/file=${output.name}`;
      }
    }
    
    throw new Error('No video data in response');

  } catch (error) {
    console.error(`Error generating video with ${modelKey}:`, error);
    throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : String(error)}`);
  }
}
