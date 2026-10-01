import { useVisualizerStore, selectCurrentFrame } from '@/store/useVisualizerStore'
import GraphCanvas from './GraphCanvas'
import ArrayCanvas from './ArrayCanvas'
import SearchArrayCanvas from './SearchArrayCanvas'

export default function CanvasRouter() {
    const selectedAlgorithm = useVisualizerStore(s => s.selectedAlgorithm)
    const frame             = useVisualizerStore(selectCurrentFrame)

    if (!selectedAlgorithm) {
        return (
            <div className="h-full flex items-center justify-center text-neutral-600 text-sm">
                Select an algorithm to begin
            </div>
        )
    }

    if (!frame) {
        return (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                Loading…
            </div>
        )
    }

    if (frame.visual.type === 'graph') return <GraphCanvas />
    if (frame.visual.type === 'array') return <ArrayCanvas />
    if (frame.visual.type === 'search-array') return <SearchArrayCanvas />

    return null
}