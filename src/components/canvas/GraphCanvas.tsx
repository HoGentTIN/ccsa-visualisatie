import {
    ReactFlow, Controls, ConnectionMode,
    type Node, type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useVisualizerStore, selectCurrentFrame } from '@/store/useVisualizerStore'
import type { GraphNodeState, GraphEdgeState, EdgeStatus } from '@/algorithms/shared/types'
import AlgoNode from './AlgoNode'

const NODE_TYPES = { algoNode: AlgoNode }

const EDGE_COLOR: Record<EdgeStatus, string> = {
    default: '#737373',
    active:  '#2563eb',
    path:    '#ea580c',
}

function toFlowNodes(
    nodes: GraphNodeState[],
    overrides: Record<string, { x: number; y: number }>,
): Node[] {
    return nodes.map(n => ({
        id: n.id,
        type: 'algoNode',
        position: overrides[n.id] ?? { x: n.x, y: n.y },
        data: { label: n.label, status: n.status, value: n.value },
    }))
}

function toFlowEdges(edges: GraphEdgeState[]): Edge[] {
    return edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: 'center',
        targetHandle: 'center-target',
        label: e.weight !== undefined ? String(e.weight) : undefined,
        animated: e.status === 'active',
        type: 'straight',
        style: {
            stroke: EDGE_COLOR[e.status],
            strokeWidth: e.status !== 'default' ? 3 : 1.5,
        },
        labelStyle: {
            fill: '#404040',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'monospace',
        },
        labelBgStyle: {
            fill: '#ffffff',
            fillOpacity: 1,
            stroke: '#d4d4d4',
            strokeWidth: 1,
        },
        labelBgPadding: [4, 2] as [number, number],
    }))
}

export default function GraphCanvas() {
    const frame = useVisualizerStore(selectCurrentFrame)
    const overrides = useVisualizerStore(s => s.nodePositionOverrides)
    const setNodePosition = useVisualizerStore(s => s.setNodePosition)
    const selectedAlgorithm = useVisualizerStore(s => s.selectedAlgorithm)

    if (!frame || frame.visual.type !== 'graph') return null

    const graphVisual = frame.visual

    const nodes = toFlowNodes(graphVisual.nodes, overrides)
    const edges = toFlowEdges(graphVisual.edges)

    const handleNodeDrag = (_event: React.MouseEvent, node: Node) => {
        setNodePosition(node.id, node.position)
    }

    // Heuristic support:
    // Algorithms can attach `heuristic` to the graph visual:
    //   visual: { type: 'graph', nodes, edges, heuristic: Record<nodeId, number> }
    const heuristic = graphVisual.heuristic
    const hasHeuristic =
        heuristic &&
        typeof heuristic === 'object' &&
        graphVisual.nodes.some(n => Object.prototype.hasOwnProperty.call(heuristic, n.id))

    const heuristicEntries = hasHeuristic
        ? graphVisual.nodes.map(n => ({
            id: n.id,
            label: n.label,
            h: heuristic![n.id] ?? 0,
        }))
        : []

    return (
        <div className="h-full w-full bg-white flex flex-col">
            <div className="flex-1 min-h-0">
                <ReactFlow
                    key={selectedAlgorithm?.id}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={NODE_TYPES}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    fitViewOptions={{ padding: 0.25 }}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    onNodeDrag={handleNodeDrag}
                    proOptions={{ hideAttribution: true }}
                    colorMode="light"
                >
                    <Controls
                        showInteractive={false}
                        className="!border-neutral-700 !bg-neutral-900"
                    />
                </ReactFlow>
            </div>

            {hasHeuristic && heuristicEntries.length > 0 && (
                <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-xs overflow-x-auto">
                    <div className="font-semibold text-neutral-700 mb-2">
                        Heuristiek h(v)
                    </div>
                    <div className="inline-block min-w-full">
                        <table className="border border-neutral-200 rounded-sm border-collapse">
                            <thead>
                            <tr className="bg-neutral-100">
                                {heuristicEntries.map(entry => (
                                    <th
                                        key={entry.id}
                                        className="px-2 py-1 border border-neutral-200 text-center text-[11px] text-neutral-700"
                                    >
                                        {entry.label}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                {heuristicEntries.map(entry => (
                                    <td
                                        key={entry.id}
                                        className="px-2 py-1 border border-neutral-200 text-center font-mono text-[11px] text-neutral-900"
                                    >
                                        {entry.h}
                                    </td>
                                ))}
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}