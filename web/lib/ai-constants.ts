export const AI_MODELS = {
  'veo3': {
    url: 'https://rishi2025-veo3-free.hf.space',
    name: 'Cinematic Engine V3',
    description: 'Text to Video generation'
  },
  'open-sora': {
    url: 'https://kadirnar-open-sora.hf.space',
    name: 'Open Studio Pro',
    description: 'Open source video generation'
  },
  'puppet-sora': {
    url: 'https://ninjawick-pr-puppet-sora-2.hf.space',
    name: 'Motion Puppet Suite',
    description: 'Character animation'
  },
  'wan2-1': {
    url: 'https://ysharma-wan2-1-fast.hf.space',
    name: 'Velocity Generator 2.1',
    description: 'Fast video generation'
  },
  'wan2-2': {
    url: 'https://merajtime-wan2-2-animate.hf.space',
    name: 'Pro Motion 2.2',
    description: 'Animation generation'
  },
  'nanobanana': {
    url: 'https://xhaheen-nanobanana.hf.space',
    name: 'FX Core',
    description: 'Creative video effects'
  },
  'motionshop': {
    url: 'https://3daigc-motionshop2.hf.space',
    name: '3D Motion Lab',
    description: '3D Motion generation'
  },
  'vider': {
    url: 'https://api.vider.ai/api/freev1',
    name: 'Fernn AI',
    description: 'Unlimited free video generation'
  },
  'ltx-video': {
    url: 'https://lightricks-ltx-video-distilled.hf.space',
    name: 'LTX Video Distilled',
    description: 'Fast high-quality video generation'
  },
  'heartsync': {
    url: 'https://heartsync-nsfw-uncensored-video2.hf.space',
    name: 'HeartSync Video',
    description: 'Uncensored video generation',
    is18Plus: true
  },
  'flux-dev': {
    url: 'https://black-forest-labs-flux-1-dev.hf.space',
    name: 'Flux 1 Dev',
    description: 'High-quality image generation'
  },
  'faceswap': {
    url: 'https://alsv-faceswapall.hf.space',
    name: 'FaceSwap Suite',
    description: 'Advanced face swapping'
  },
  'turbo-image': {
    url: 'https://mrfakename-z-image-turbo.hf.space',
    name: 'Turbo Image Z',
    description: 'Fast image generation'
  }
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

