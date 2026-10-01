import { useVisualizerStore, selectCurrentFrame } from '@/store/useVisualizerStore'

interface SearchArrayElementViewProps {
    value: unknown
    index: number
    isTarget: boolean
    isCurrent: boolean
}

function SearchArrayElementView({
                                    value,
                                    index,
                                    isTarget,
                                    isCurrent,
                                }: SearchArrayElementViewProps) {
    // Decide colors based on target/current flags
    const baseClasses =
        'flex flex-col items-center justify-center px-3 py-2 rounded-md border text-xs font-mono min-w-[40px]'

    let colorClasses = 'bg-white border-neutral-300 text-neutral-800'
    if (isTarget && isCurrent) {
        colorClasses = 'bg-amber-100 border-amber-600 text-amber-900'
    } else if (isTarget) {
        colorClasses = 'bg-blue-50 border-blue-600 text-blue-900'
    } else if (isCurrent) {
        colorClasses = 'bg-amber-50 border-amber-500 text-amber-900'
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`${baseClasses} ${colorClasses}`}>
                <span className="text-2xl break-all">{String(value)}</span>
            </div>
            <span className="text-base text-neutral-500 font-mono">[{index}]</span>
        </div>
    )
}

export default function SearchArrayCanvas() {
    const frame = useVisualizerStore(selectCurrentFrame)

    if (!frame || frame.visual.type !== 'search-array') return null

    const { elements, targetIndex, currentIndex = -1 } = frame.visual

    return (
        <div className="h-full w-full bg-white flex flex-col items-center justify-center gap-4 p-6">
            <div className="flex gap-3 items-end">
                {elements.map((el, idx) => (
                    <SearchArrayElementView
                        key={el.id}
                        value={el.value}
                        index={idx}
                        isTarget={idx === targetIndex}
                        isCurrent={idx === currentIndex}
                    />
                ))}
            </div>

            <div className="flex gap-4 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded border border-blue-600 bg-blue-50" />
                    Doel (target)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded border border-amber-500 bg-amber-50" />
                    Huidige index
                </span>
            </div>
        </div>
    )
}