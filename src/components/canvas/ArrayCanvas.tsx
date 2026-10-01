import { motion, AnimatePresence } from 'framer-motion'
import { useVisualizerStore, selectCurrentFrame } from '@/store/useVisualizerStore'
import { useMemo } from 'react'
import type { ArrayElement } from '@/algorithms/shared/types'

const STATUS_COLOR: Record<ArrayElement['status'], string> = {
    default:   'bg-neutral-500',
    comparing: 'bg-yellow-400',
    active:    'bg-blue-500',
    sorted:    'bg-green-500',
}

const STATUS_GLOW: Record<ArrayElement['status'], string> = {
    default:   '',
    comparing: 'shadow-yellow-400/50',
    active:    'shadow-blue-500/50',
    sorted:    '',
}

interface BarProps {
    element: ArrayElement
    heightPct: number
}

function Bar({ element, heightPct }: BarProps) {
    const color = STATUS_COLOR[element.status]
    const glow  = STATUS_GLOW[element.status]

    return (
        // layoutId drives position animation — Framer tracks this element by id
        // across renders and smoothly transitions it to its new position
        <motion.div
            layoutId={`bar-${element.id}`}
            layout
            className="flex flex-col items-center gap-1 flex-1 max-w-[56px] min-w-[20px] h-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Value label above bar */}
            <motion.span
                layout
                className="text-[11px] text-neutral-400 font-mono tabular-nums shrink-0"
            >
                {element.value}
            </motion.span>

            {/* Growable area — bar height is relative to this container */}
            <div className="flex-1 w-full flex flex-col justify-end min-h-0">
                <motion.div
                    className={`w-full rounded-t-sm shadow-lg transition-colors duration-150 ${color} ${glow}`}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            </div>

            {/* Index label below bar */}
            <motion.span layout className="text-[10px] text-neutral-600 font-mono shrink-0">
                {element.id}
            </motion.span>
        </motion.div>
    )
}

export default function ArrayCanvas() {
    const frame = useVisualizerStore(selectCurrentFrame)
    const frames = useVisualizerStore(s => s.frames)

    // Calculate maxVal from ALL frames, not just the current one
    // This prevents bars from resizing when elements are temporarily removed
    const maxVal = useMemo(() => {
        if (frames.length === 0) return 1
        
        let max = 1
        for (const f of frames) {
            if (f.visual.type === 'array') {
                for (const el of f.visual.elements) {
                    if (el.value > max) max = el.value
                }
            }
        }
        return max
    }, [frames])

    if (!frame || frame.visual.type !== 'array') return null

    const { elements } = frame.visual
    return (
        <div className="h-full w-full flex flex-col items-center justify-end p-8 pb-6 gap-4">

            {/* Bars container — must be relative so Framer can manage layout */}
            <motion.div
                layout
                className="flex gap-2 items-end w-full justify-center"
                style={{ height: '80%' }}
            >
                <AnimatePresence mode="popLayout">
                    {elements.map(el => (
                        <Bar
                            key={el.id}
                            element={el}
                            heightPct={(el.value / maxVal) * 100}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Legend */}
            <div className="flex gap-4 text-[11px] text-neutral-500 shrink-0">
                {Object.entries(STATUS_COLOR).map(([status, color]) => (
                    <span key={status} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                        {status}
          </span>
                ))}
            </div>
        </div>
    )
}