import { useState } from 'react'
import Sidebar    from './Sidebar'
import ControlBar from './ControlBar'

interface AppShellProps {
    canvas: React.ReactNode
    code: React.ReactNode
    variables: React.ReactNode
    callStack?: React.ReactNode
}

export default function AppShell({ canvas, code, variables, callStack }: AppShellProps) {
    const [canvasHeightRatio, setCanvasHeightRatio] = useState(0.6) // 60% canvas, 40% bottom

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        const startY = e.clientY
        const startRatio = canvasHeightRatio

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY
            // Use viewport height as approximation of total available height
            const deltaRatio = deltaY / window.innerHeight
            let next = startRatio + deltaRatio
            // Clamp so neither area becomes unusably small
            next = Math.min(0.85, Math.max(0.15, next))
            setCanvasHeightRatio(next)
        }

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    return (
        <div className="flex h-screen w-screen bg-white text-neutral-950 overflow-hidden">
            <div className="flex flex-col flex-1 min-w-0">
                {/* Top: canvas */}
                <div
                    className="border-b border-neutral-200 overflow-hidden min-h-0 bg-white"
                    style={{ flex: `${canvasHeightRatio} 1 0%` }}
                >
                    {canvas}
                </div>

                {/* Drag handle between canvas and bottom panels */}
                <div
                    onMouseDown={handleDragStart}
                    className="h-1 cursor-row-resize bg-neutral-200 hover:bg-neutral-300 transition-colors"
                />

                {/* Bottom: code / variables / call stack */}
                <div
                    className="flex min-h-0"
                    style={{ flex: `${1 - canvasHeightRatio} 1 0%` }}
                >
                    <div className="flex-1 border-r border-neutral-700 overflow-auto p-4">
                        {code}
                    </div>
                    <div className={`${callStack ? 'w-80 border-r border-neutral-700' : 'w-80'} overflow-auto p-4`}>
                        {variables}
                    </div>
                    {callStack && (
                        <div className="w-80 overflow-auto p-4">
                            {callStack}
                        </div>
                    )}
                </div>

                {/* Keyboard hint bar */}
                <div className="px-4 py-1 bg-white border-t border-neutral-200 flex gap-4 text-[11px] text-neutral-500">
                    <span><kbd className="bg-neutral-100 border border-neutral-200 text-neutral-700 px-1 rounded">Space</kbd> play/pause</span>
                    <span><kbd className="bg-neutral-100 border border-neutral-200 text-neutral-700 px-1 rounded">←</kbd><kbd className="bg-neutral-100 border border-neutral-200 text-neutral-700 px-1 rounded ml-0.5">→</kbd> step</span>
                    <span><kbd className="bg-neutral-100 border border-neutral-200 text-neutral-700 px-1 rounded">R</kbd> reset</span>
                </div>

                <ControlBar />
            </div>

            <Sidebar />
        </div>
    )
}