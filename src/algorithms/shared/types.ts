// --- Visual State ---
export type NodeStatus = 'unvisited' | 'active' | 'visited' | 'path'
export type EdgeStatus = 'default' | 'active' | 'path'

export interface GraphNodeState {
    id: string
    label: string
    status: NodeStatus
    value?: string | number
    x: number
    y: number
}

export interface GraphEdgeState {
    id: string
    source: string
    target: string
    weight?: number
    status: EdgeStatus
}

export interface ArrayElement {
    id: string
    value: number
    status: 'default' | 'active' | 'comparing' | 'sorted'
}

export interface SearchArrayElement {
    id: string
    value: unknown
}

export type VisualState =
    | {
    type: 'graph'
    nodes: GraphNodeState[]
    edges: GraphEdgeState[]
    /** Optional heuristic values per node; used by graph-based search algorithms (e.g. A*). */
    heuristic?: Record<string, number>
}
    | { type: 'array'; elements: ArrayElement[] }
    | {
    type: 'search-array'
    elements: SearchArrayElement[]
    /** Index of the target element in `elements` (0-based). */
    targetIndex: number
    /** Index currently being inspected; -1 or undefined means "no current". */
    currentIndex?: number
}

// --- Frame ---

export type VariableMap = Record<string, unknown>

export interface CallStackFrame {
    id: string
    name: string
    args?: Record<string, unknown>
    note?: string
}

export interface AlgorithmFrame {
    visual: VisualState
    variables: VariableMap
    highlightedLines: number[]
    description: string
    callStack?: CallStackFrame[]
}


// --- Algorithm Definition ---

export type VisualType = 'graph' | 'array'
export type AlgorithmCategory = 'graph' | 'sorting' | 'search' | 'tree' | 'search_array'

export interface AlgorithmInputOption<TInput = unknown> {
    id: string
    name: string
    input: TInput
}

export interface AlgorithmDefinition<TInput = unknown> {
    id: string
    name: string
    category: AlgorithmCategory
    visualType: VisualType
    defaultInputId: string
    inputs: AlgorithmInputOption<TInput>[]
    pythonCode: string
    run: (input: TInput) => Generator<AlgorithmFrame>
    showCallStack?: boolean
}

// Type-erased alias used by the store and registry
export type AnyAlgorithmDefinition = AlgorithmDefinition<unknown>

// Use this in every algorithm file instead of annotating the export directly.
// It enforces the full typed contract inside the algorithm, then safely erases
// the generic at the boundary so the store can hold a mixed list.
export function defineAlgorithm<TInput>(
    def: AlgorithmDefinition<TInput>
): AnyAlgorithmDefinition {
    return def as AnyAlgorithmDefinition
}

// Each algorithm can supply a React component for editing its input.
// TInput is the same generic as AlgorithmDefinition<TInput>.
export interface InputEditorProps<TInput> {
    value: TInput
    onChange: (next: TInput) => void
}