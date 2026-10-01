import { useVisualizerStore } from '@/store/useVisualizerStore'
// import InputEditorModal from '@/components/input/InputEditorModal'

export default function ControlBar() {
    const {
        frames, currentFrameIndex,
        isPlaying, setIsPlaying,
        stepForward, stepBackward, reset,
        playbackSpeed, setPlaybackSpeed,
        goToFrame,
    } = useVisualizerStore()

    const atStart  = currentFrameIndex === 0
    const atEnd    = currentFrameIndex === frames.length - 1
    const hasFrames = frames.length > 0

    return (
        <div className="h-14 bg-white border-t border-neutral-200 flex items-center gap-2 px-4 shrink-0 shadow-[0_-1px_8px_rgba(15,23,42,0.04)]">

            {/* Input editor */}
            {/*<InputEditorModal />*/}

            {/*<div className="w-px h-6 bg-neutral-200 mx-1" />*/}

            {/* Playback */}
            <button onClick={reset} disabled={!hasFrames || atStart}
                    className="px-3 py-1.5 rounded-lg text-sm bg-neutral-100 text-neutral-800 disabled:opacity-30 hover:bg-neutral-200">
                ⏮
            </button>
            <button onClick={() => stepBackward()} disabled={!hasFrames || atStart}
                    className="px-3 py-1.5 rounded-lg text-sm bg-neutral-100 text-neutral-800 disabled:opacity-30 hover:bg-neutral-200">
                ←
            </button>
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!hasFrames || atEnd}
                className="px-4 py-1.5 rounded-lg text-sm bg-blue-600 text-white font-bold disabled:opacity-30 hover:bg-blue-500 min-w-[72px]">
                {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button onClick={() => stepForward()} disabled={!hasFrames || atEnd}
                    className="px-3 py-1.5 rounded-lg text-sm bg-neutral-100 text-neutral-800 disabled:opacity-30 hover:bg-neutral-200">
                →
            </button>

            {/* Speed */}
            <div className="flex items-center gap-2 ml-2">
                <span className="text-neutral-500 text-xs font-semibold">Speed</span>
                <input
                    type="range" min={100} max={2000} step={100}
                    value={playbackSpeed}
                    onChange={e => setPlaybackSpeed(Number(e.target.value))}
                    className="w-20 accent-blue-600"
                />
                <span className="text-neutral-500 text-xs w-12">{playbackSpeed}ms</span>
            </div>

            {/* Timeline scrubber */}
            {hasFrames && (
                <>
                    <input
                        type="range" min={0} max={frames.length - 1}
                        value={currentFrameIndex}
                        onChange={e => goToFrame(Number(e.target.value))}
                        className="flex-1 mx-2 accent-blue-600"
                    />
                    <span className="text-neutral-500 text-xs whitespace-nowrap tabular-nums">
            {currentFrameIndex + 1} / {frames.length}
          </span>
                </>
            )}
        </div>
    )
}