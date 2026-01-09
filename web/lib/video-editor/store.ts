import { create } from 'zustand'

export interface Clip {
  id: string
  type: 'video' | 'audio' | 'image' | 'text'
  start: number // start time in timeline (seconds)
  duration: number // duration in timeline (seconds)
  offset: number // start offset in source file (seconds)
  track: number
  source: string | File
  thumbnail?: string
  name: string
  volume?: number
  styles?: any
}

export interface Track {
  id: number
  type: 'video' | 'audio' | 'overlay'
  muted: boolean
  locked: boolean
  visible: boolean
}

interface EditorState {
  clips: Clip[]
  tracks: Track[]
  currentTime: number
  duration: number
  zoom: number
  isPlaying: boolean
  selectedClipId: string | null
  
  // Actions
  setClips: (clips: Clip[]) => void
  addClip: (clip: Clip) => void
  updateClip: (id: string, updates: Partial<Clip>) => void
  removeClip: (id: string) => void
  setTracks: (tracks: Track[]) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setZoom: (zoom: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setSelectedClipId: (id: string | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  clips: [],
  tracks: [
    { id: 0, type: 'video', muted: false, locked: false, visible: true },
    { id: 1, type: 'audio', muted: false, locked: false, visible: true },
    { id: 2, type: 'overlay', muted: false, locked: false, visible: true },
  ],
  currentTime: 0,
  duration: 0,
  zoom: 10, // pixels per second
  isPlaying: false,
  selectedClipId: null,

  setClips: (clips) => set({ clips }),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  updateClip: (id, updates) => set((state) => ({
    clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),
  removeClip: (id) => set((state) => ({
    clips: state.clips.filter((c) => c.id !== id),
  })),
  setTracks: (tracks) => set({ tracks }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setZoom: (zoom) => set({ zoom }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
}))


