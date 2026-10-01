import { useEffect } from 'react'
import { useVisualizerStore } from '@/store/useVisualizerStore'

export function useKeyboardShortcuts() {
    const stepForward  = useVisualizerStore(s => s.stepForward)
    const stepBackward = useVisualizerStore(s => s.stepBackward)
    const setIsPlaying = useVisualizerStore(s => s.setIsPlaying)
    const isPlaying    = useVisualizerStore(s => s.isPlaying)
    const reset        = useVisualizerStore(s => s.reset)
    const frames       = useVisualizerStore(s => s.frames)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't fire shortcuts when user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (e.target instanceof HTMLSelectElement) return

            if (e.key === 'ArrowRight') { e.preventDefault(); stepForward() }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); stepBackward() }
            if (e.key === ' ')          { e.preventDefault(); if (frames.length > 0) setIsPlaying(!isPlaying) }
            if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reset() }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isPlaying, frames.length])
}