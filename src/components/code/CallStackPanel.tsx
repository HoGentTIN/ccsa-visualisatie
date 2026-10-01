import { useVisualizerStore, selectCurrentFrame } from '@/store/useVisualizerStore'

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'None'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

export default function CallStackPanel() {
    const frame = useVisualizerStore(selectCurrentFrame)

    if (!frame) {
        return (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                Call stack will appear here
            </div>
        )
    }

    const stack = frame.callStack ?? []

    // Show latest call on top: reverse the stack for rendering
    const displayStack = [...stack].reverse()

    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-1">
                Call Stack
            </h2>

            {displayStack.length === 0 && (
                <p className="text-neutral-500 text-xs">No call stack for this step</p>
            )}

            {displayStack.map((entry, index) => {
                const isTop = index === 0 // first in reversed list is the top frame

                return (
                    <div
                        key={entry.id}
                        className={`rounded-md px-3 py-2 border text-xs ${
                            isTop
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-neutral-50 border-neutral-200'
                        }`}
                    >
                        <div className="flex justify-between items-center gap-2 mb-1.5">
                            <span className="text-blue-700 font-mono text-xs font-semibold">
                                {entry.name}
                            </span>
                            {isTop && (
                                <span className="text-blue-600 text-[10px] font-semibold uppercase tracking-wider">
                                    top
                                </span>
                            )}
                        </div>

                        {entry.args && Object.keys(entry.args).length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                {Object.entries(entry.args).map(([name, value]) => (
                                    <div key={name} className="text-xs font-mono">
                                        <span className="text-neutral-600">{name}: </span>
                                        <span className="text-emerald-700 break-all">
                                            {formatValue(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {entry.note && (
                            <p className="mt-1.5 text-[11px] text-neutral-600 italic">
                                {entry.note}
                            </p>
                        )}
                    </div>
                )
            })}
        </div>
    )
}