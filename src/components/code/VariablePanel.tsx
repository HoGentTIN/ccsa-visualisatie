import { useVisualizerStore, selectCurrentFrame } from '@/store/useVisualizerStore'

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'None'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
}

export default function VariablePanel() {
    const frame = useVisualizerStore(selectCurrentFrame)

    // Grab the previous frame directly from the store for diffing
    const prevFrame = useVisualizerStore(s =>
        s.currentFrameIndex > 0 ? s.frames[s.currentFrameIndex - 1] : null
    )

    if (!frame) {
        return (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm bg-white">
                Variables will appear here
            </div>
        )
    }

    const entries = Object.entries(frame.variables)

    return (
        <div className="flex flex-col gap-2 bg-white text-neutral-950">
            <h2 className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-1">
                Variables
            </h2>

            {entries.length === 0 && (
                <p className="text-neutral-500 text-xs">No variables this step</p>
            )}

            {entries.map(([name, value]) => {
                const prevValue = prevFrame?.variables[name]
                const changed = JSON.stringify(value) !== JSON.stringify(prevValue)
                const isNew = prevFrame !== null && !(name in (prevFrame?.variables ?? {}))

                return (
                    <div
                        key={name}
                        className={`rounded-lg border px-3 py-2 transition-all duration-200 shadow-sm ${
                            changed
                                ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200'
                                : 'bg-white border-neutral-200'
                        }`}
                    >
                        <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="text-blue-700 font-mono text-xs font-semibold">{name}</span>
                            {isNew && (
                                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider">new</span>
                            )}
                            {!isNew && changed && (
                                <span className="rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-amber-700 text-[10px] font-semibold uppercase tracking-wider">changed</span>
                            )}
                        </div>
                        <pre className="text-neutral-800 font-mono text-xs break-all whitespace-pre-wrap max-h-40 overflow-auto">
              {formatValue(value)}
            </pre>
                    </div>
                )
            })}
        </div>
    )
}