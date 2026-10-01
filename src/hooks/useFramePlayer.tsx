import { useEffect, useRef } from 'react'
import { useVisualizerStore } from '@/store/useVisualizerStore'

/**
 * Drives automatic playback. When isPlaying is true, advances one frame
 * every `playbackSpeed` ms. Cleans up its own interval automatically.
 */
export function useFramePlayer() {
    const isPlaying     = useVisualizerStore(s => s.isPlaying)
    const playbackSpeed = useVisualizerStore(s => s.playbackSpeed)
    const stepForward   = useVisualizerStore(s => s.stepForward)

    // Keep a stable ref to stepForward so the interval callback
    // never closes over a stale version
    const stepRef = useRef(stepForward)
    useEffect(() => { stepRef.current = stepForward }, [stepForward])

    useEffect(() => {
        if (!isPlaying) return

        const id = setInterval(() => stepRef.current(), playbackSpeed)
        return () => clearInterval(id)

        // Restart the interval if speed changes mid-play
    }, [isPlaying, playbackSpeed])
}