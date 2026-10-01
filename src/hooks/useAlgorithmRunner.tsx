import { useEffect } from 'react'
import { useVisualizerStore } from '@/store/useVisualizerStore'
import type { AlgorithmFrame } from '@/algorithms/shared/types'

/**
 * Watches for algorithm/input changes and eagerly drains the generator
 * into a flat array of frames, then pushes them into the store.
 */
export function useAlgorithmRunner() {
    const selectedAlgorithm = useVisualizerStore(s => s.selectedAlgorithm)
    const currentInput      = useVisualizerStore(s => s.currentInput)
    const setFrames         = useVisualizerStore(s => s.setFrames)

    useEffect(() => {
        if (!selectedAlgorithm) return

        const input = currentInput ?? selectedAlgorithm.inputs[0].input
        const frames: AlgorithmFrame[] = []

        try {
            const generator = selectedAlgorithm.run(input)
            for (const frame of generator) {
                frames.push(frame)
            }
        } catch (err) {
            console.error(`[Runner] Error in algorithm "${selectedAlgorithm.id}":`, err)
        }
        // DEBUG: log path edges per frame
        frames.forEach((f, i) => {
            if (f.visual.type === 'graph') {
                const pathEdges = f.visual.edges.filter(e => e.status === 'path').map(e => e.id)
                if (pathEdges.length > 0) {
                    console.log(`Frame ${i}: path edges = [${pathEdges.join(', ')}] — ${f.description}`)
                }
            }
        })
        setFrames(frames)
    }, [selectedAlgorithm, currentInput])
}