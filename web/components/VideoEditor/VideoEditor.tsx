// TimelineEditor import temporarily commented out for debugging
// import { TimelineEditor } from './Timeline/TimelineEditor'
import { PreviewCanvas } from './Canvas/PreviewCanvas'
import { EditorToolbar } from './Toolbar/EditorToolbar'
import { exportVideo } from '@/lib/video-editor/export-handler'
import { useEditorStore } from '@/lib/video-editor/store'
import { TimelineEditor } from '@/components/VideoEditor/Timeline/TimelineEditor' // Using absolute import

interface VideoEditorProps {
  initialVideoUrl?: string
  initialVideoId?: string
  onExport?: () => void
  onCancel?: () => void
}

export function VideoEditor({ initialVideoUrl, initialVideoId, onExport, onCancel }: VideoEditorProps) {
  const { clips, duration, addClip, setDuration } = useEditorStore()

  const handleExport = async () => {
    // Basic export implementation
    const blob = await exportVideo(clips, duration)
    console.log('Exported blob size:', blob.size)
    
    if (onExport) {
        onExport()
    }
  }

  useEffect(() => {
    if (initialVideoUrl) {
      // Add initial video clip
      addClip({
        id: 'main-video',
        type: 'video',
        start: 0,
        duration: 10, // Default to 10s, should load metadata
        offset: 0,
        track: 0,
        source: initialVideoUrl,
        name: 'Main Video'
      })
      setDuration(10) // Set initial duration
      
      // Load video metadata to get actual duration
      const video = document.createElement('video')
      video.src = initialVideoUrl
      video.onloadedmetadata = () => {
        setDuration(video.duration)
        useEditorStore.getState().updateClip('main-video', { duration: video.duration })
      }
    }
  }, [initialVideoUrl])

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white overflow-hidden">
      <EditorToolbar onExport={handleExport} />
      
      <div className="flex-1 flex flex-col relative">
        <PreviewCanvas />
        <TimelineEditor />
      </div>
    </div>
  )
}
