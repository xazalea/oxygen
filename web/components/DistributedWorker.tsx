'use client'

import { useEffect, useRef } from 'react'
import { fetchChannelVideos } from '@/lib/piped-service'
import { fetchUserVideos } from '@/lib/tiktok-api-enhanced' // Note: This might fail CORS client-side, handled below

export function DistributedWorker() {
  // Use a ref to prevent double-execution in Strict Mode
  const isRunning = useRef(false)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    const runWorker = async () => {
      if (isRunning.current) return
      
      // Check if device is in a good state to run background tasks
      // API might not be available in all browsers
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore
          const battery = await navigator.getBattery()
          // If battery is low and not charging, skip
          if (!battery.charging && battery.level < 0.2) {
            console.log('Worker skipped: Low battery')
            return
          }
        } catch (e) {
          // Ignore battery check errors
        }
      }

      isRunning.current = true
      
      try {
        // 1. Request task
        const response = await fetch('/api/worker/task')
        if (!response.ok) {
           throw new Error('Failed to fetch task')
        }
        
        const { task } = await response.json()
        
        if (!task) {
          console.log('Worker: No tasks available')
          return
        }
        
        console.log(`Worker: Received task ${task.type} for ${task.identifier}`)
        
        // 2. Check cache first before executing task
        let cacheHit = false
        // Ensure identifier is clean (no @ for username if present in identifier, though logic handles it)
        const cacheIdentifier = task.identifier.replace(/^@/, '')
        const cacheKey = task.type === 'youtube' ? `youtube/${cacheIdentifier}` : `tiktok/${cacheIdentifier}`
        const cacheUrl = `https://cdn.jsdelivr.net/gh/xazalea/oxygen@main/cache-package/data/${cacheKey}.json`
        
        try {
          const cacheCheck = await fetch(cacheUrl, { method: 'HEAD' })
          if (cacheCheck.ok) {
            console.log(`Worker: Cache hit for ${task.identifier}, skipping execution`)
            cacheHit = true
          }
        } catch (e) {
          // Cache miss, proceed with execution
        }

        if (cacheHit) {
          // Report as successful but with cached data flag if needed
          // Or just skip execution
          await fetch('/api/worker/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: task.userId,
              platform: task.type,
              videos: [],
              cached: true
            })
          })
          return
        }

        let results: any[] = []
        
        // 3. Execute task (only if cache miss)
        if (task.type === 'youtube') {
           const { fetchChannelVideos } = await import('@/lib/piped-service')
           results = await fetchChannelVideos(task.identifier)
        } else if (task.type === 'tiktok') {
           // Fetch TikTok videos using client-side extraction via Proxy
           const { fetchUserVideos } = await import('@/lib/tiktok-api-enhanced')
           // We use the same service, but it now points to the proxy internally
           const { videos } = await fetchUserVideos(task.identifier, 10)
           results = videos
        }
        
        // 3. Submit results
        if (results && results.length > 0) {
          await fetch('/api/worker/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: task.userId,
              platform: task.type,
              videos: results
            })
          })
          console.log(`Worker: Submitted ${results.length} videos`)
        } else {
           // Even if no results, report success/empty to update lastSyncedAt?
           // The submit API updates lastSyncedAt regardless of video count if we call it.
           // Let's call it with empty list to mark as "checked".
           await fetch('/api/worker/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: task.userId,
              platform: task.type,
              videos: []
            })
          })
        }
        
      } catch (error) {
        console.error('Distributed Worker Error:', error)
      } finally {
        isRunning.current = false
      }
    }

    // Run immediately on mount (with delay to let app load)
    const initialTimer = setTimeout(runWorker, 5000)
    
    // Run periodically (e.g. every 10 minutes)
    const intervalTimer = setInterval(runWorker, 10 * 60 * 1000)
    
    return () => {
      clearTimeout(initialTimer)
      clearInterval(intervalTimer)
    }
  }, [])

  return null // Renderless component
}

