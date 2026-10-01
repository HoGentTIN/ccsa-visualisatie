import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { NodeStatus } from '@/algorithms/shared/types'

export type AlgoNodeData = {
    label: string
    status: NodeStatus
    value?: string | number
}

export type AlgoNodeType = Node<AlgoNodeData>

const STATUS_STYLES: Record<NodeStatus, string> = {
    unvisited: 'bg-white border-neutral-400 text-neutral-800 shadow-neutral-300/50',
    active:    'bg-blue-100 border-blue-600 text-blue-900 shadow-blue-300/60',
    visited:   'bg-purple-100 border-purple-600 text-purple-900 shadow-purple-300/60',
    path:      'bg-orange-100 border-orange-600 text-orange-900 shadow-orange-300/60',
}

// Invisible handles on all four sides so React Flow can route any edge cleanly
const HANDLE_STYLE: React.CSSProperties = {
    opacity: 0,
    pointerEvents: 'none',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
}

export default function AlgoNode({ data }: NodeProps<AlgoNodeType>) {
    return (
        <div
            className={`
        inline-flex flex-col items-center justify-center
        px-3 py-1.5 rounded-full border-2 shadow-lg
        max-w-[8rem]
        transition-all duration-300 select-none
        ${STATUS_STYLES[data.status]}
      `}
        >
            {/* Single centered handle for both source and target */}
            <Handle type="source" position={Position.Top} style={HANDLE_STYLE} id="center" />
            <Handle type="target" position={Position.Top} style={HANDLE_STYLE} id="center-target" />

            <span className="font-semibold text-xs leading-snug text-center truncate">
                {data.label}
            </span>
            {data.value !== undefined && (
                <span className="text-[10px] opacity-80 mt-0.5 leading-none text-center">
                    {data.value}
                </span>
            )}
        </div>
    )
}