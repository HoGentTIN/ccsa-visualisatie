import { create } from 'zustand'
import type { AnyAlgorithmDefinition, AlgorithmFrame } from '@/algorithms/shared/types'

interface VisualizerState {
    algorithms: AnyAlgorithmDefinition[]
    selectedAlgorithm: AnyAlgorithmDefinition | null
    selectedInputId: string | null
    currentInput: unknown
    frames: AlgorithmFrame[]
    currentFrameIndex: number
    isPlaying: boolean
    playbackSpeed: number
    nodePositionOverrides: Record<string, { x: number; y: number }>

    registerAlgorithms: (algos: AnyAlgorithmDefinition[]) => void
    selectAlgorithm: (id: string) => void
    setInput: (input: unknown) => void
    setFrames: (frames: AlgorithmFrame[]) => void
    selectAlgorithmInput: (inputId: string) => void
    goToFrame: (index: number) => void
    stepForward: () => void
    stepBackward: () => void
    setIsPlaying: (playing: boolean) => void
    setPlaybackSpeed: (ms: number) => void
    setNodePosition: (id: string, position: { x: number; y: number }) => void
    reset: () => void
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
    algorithms: [],
    selectedAlgorithm: null,
    selectedInputId: null,
    currentInput: null,
    frames: [],
    currentFrameIndex: 0,
    isPlaying: false,
    playbackSpeed: 800,
    nodePositionOverrides: {},

    registerAlgorithms: (algos) => set({ algorithms: algos }),

    selectAlgorithm: (id) => {
        const algo = get().algorithms.find(a => a.id === id) ?? null
        const defaultInput =
            algo?.inputs.find(input => input.id === algo.defaultInputId) ??
            algo?.inputs[0] ??
            null

        set({
            selectedAlgorithm: algo,
            selectedInputId: defaultInput?.id ?? null,
            currentInput: defaultInput?.input ?? null,
            frames: [],
            currentFrameIndex: 0,
            isPlaying: false,
            nodePositionOverrides: {},
        })
    },

    setInput: (input) => set({ currentInput: input }),
    selectAlgorithmInput: (inputId) => {
        const algo = get().selectedAlgorithm
        const inputOption = algo?.inputs.find(input => input.id === inputId)

        if (!algo || !inputOption) return

        set({
            selectedInputId: inputOption.id,
            currentInput: inputOption.input,
            frames: [],
            currentFrameIndex: 0,
            isPlaying: false,
            nodePositionOverrides: {},
        })
    },

    setFrames: (frames) => set({ frames, currentFrameIndex: 0, isPlaying: false, nodePositionOverrides: {} }),

    goToFrame: (index) => {
        const { frames } = get()
        if (index >= 0 && index < frames.length) set({ currentFrameIndex: index })
    },

    stepForward: () => {
        const { currentFrameIndex, frames, setIsPlaying } = get()
        if (currentFrameIndex < frames.length - 1) {
            set({ currentFrameIndex: currentFrameIndex + 1 })
        } else {
            setIsPlaying(false)
        }
    },

    stepBackward: () => {
        const { currentFrameIndex } = get()
        if (currentFrameIndex > 0) set({ currentFrameIndex: currentFrameIndex - 1 })
    },

    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
    reset: () => set({ currentFrameIndex: 0, isPlaying: false, nodePositionOverrides: {} }),

    setNodePosition: (id, position) =>
        set(state => ({
            nodePositionOverrides: { ...state.nodePositionOverrides, [id]: position },
        })),
}))

// Selector — use this anywhere you need the current frame
export const selectCurrentFrame = (s: VisualizerState) =>
    s.frames.length > 0 ? s.frames[s.currentFrameIndex] : null