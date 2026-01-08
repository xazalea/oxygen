import React from 'react'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { Scissors, Type, Music, Image as ImageIcon, Wand2, Undo, Redo, Play, Pause, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useEditorStore } from '@/lib/video-editor/store'

export function EditorToolbar({ onExport }: { onExport: () => void }) {
  const { isPlaying, setIsPlaying, selectedClipId, removeClip } = useEditorStore()

  return (
    <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/20 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <LiquidGlass preset="pulse" className="rounded-full">
            <UiverseIconButton
            icon={<Undo className="w-4 h-4 text-white" />}
            onClick={() => {}}
            size="sm"
            />
        </LiquidGlass>
        <LiquidGlass preset="pulse" className="rounded-full">
            <UiverseIconButton
            icon={<Redo className="w-4 h-4 text-white" />}
            onClick={() => {}}
            size="sm"
            />
        </LiquidGlass>
        <div className="w-px h-6 bg-white/10 mx-2" />
        
        <LiquidGlass preset="edge" className="rounded-full">
            <UiverseIconButton
            icon={<Scissors className="w-4 h-4 text-white" />}
            onClick={() => {}}
            size="sm"
            />
        </LiquidGlass>
         <LiquidGlass preset="edge" className="rounded-full">
            <UiverseIconButton
            icon={<Type className="w-4 h-4 text-white" />}
            onClick={() => {}}
            size="sm"
            />
        </LiquidGlass>
         <LiquidGlass preset="edge" className="rounded-full">
            <UiverseIconButton
            icon={<Music className="w-4 h-4 text-white" />}
            onClick={() => {}}
            size="sm"
            />
        </LiquidGlass>
         <LiquidGlass preset="edge" className="rounded-full">
            <UiverseIconButton
            icon={<ImageIcon className="w-4 h-4 text-white" />}
            onClick={() => {}}
            size="sm"
            />
        </LiquidGlass>
         <LiquidGlass preset="edge" className="rounded-full">
            <UiverseIconButton
            icon={<Wand2 className="w-4 h-4 text-white" />}
            onClick={() => {}}
            size="sm"
            />
        </LiquidGlass>
      </div>

      <div className="flex items-center gap-2">
         <LiquidGlass preset="default" className="rounded-full">
            <UiverseIconButton
            icon={isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
            onClick={() => setIsPlaying(!isPlaying)}
            size="md"
            variant="primary"
            />
        </LiquidGlass>
      </div>

      <div className="flex items-center gap-2">
         <LiquidGlass preset="pulse" className="rounded-full">
            <UiverseIconButton
            icon={<Save className="w-4 h-4 text-white" />}
            onClick={onExport}
            size="sm"
            />
        </LiquidGlass>
      </div>
    </div>
  )
}

