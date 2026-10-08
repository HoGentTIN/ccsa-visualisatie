import { defineAlgorithm } from '@/algorithms/shared/types'
import type { AlgorithmFrame, GraphNodeState, GraphEdgeState, CallStackFrame } from '@/algorithms/shared/types'

interface TreeNode {
    id: string
    label: string
    x: number
    y: number
}

interface TreeEdge {
    id: string
    source: string
    target: string
}

export interface PreOrderInput {
    nodes: TreeNode[]
    edges: TreeEdge[]
    rootId: string
}

const pseudoCode = `# Invoer Een boom 𝑇, en een visit functie.
# Uitvoer De visit functie is aangeroepen voor elke top van de boom.
function PREORDE(𝑇,visit)
    PreOrdeRecursief(𝑇.wortel, visit) # start met de wortel
end function

function PREORDERECURSIEF(𝑣, visit)
    visit(𝑣)
    for all 𝑤 ∈ kinderen(𝑣) do # implementatie-onafhankelijk
        PreOrdeRecursief(𝑤, visit)
    end for
end function`

// Build adjacency list to find children
function buildChildren(edges: TreeEdge[]): Record<string, string[]> {
    const children: Record<string, string[]> = {}
    for (const e of edges) {
        if (!children[e.source]) children[e.source] = []
        children[e.source].push(e.target)
    }
    return children
}

// Find edge ID between parent and child
function findEdge(edges: TreeEdge[], from: string, to: string): string {
    return edges.find(e => e.source === from && e.target === to)?.id ?? ''
}

function* run(input: PreOrderInput): Generator<AlgorithmFrame> {
    const { nodes, edges, rootId } = input
    const children = buildChildren(edges)
    const visited = new Set<string>()
    const visitOrder: string[] = []
    const callStack: CallStackFrame[] = []
    const activeEdges = new Set<string>()

    const getCallStack = () => [...callStack]

    const snapshot = (activeNodes: string[] = []): GraphNodeState[] =>
        nodes.map(n => ({
            ...n,
            status: visitOrder.includes(n.id)
                ? 'path'
                : activeNodes.includes(n.id)
                    ? 'active'
                    : visited.has(n.id)
                        ? 'visited'
                        : 'unvisited',
            value: visitOrder.includes(n.id) ? visitOrder.indexOf(n.id) + 1 : undefined,
        }))

    const snapshotEdges = (): GraphEdgeState[] =>
        edges.map(e => ({
            ...e,
            status: activeEdges.has(e.id) ? 'active' : 'default',
        }))

    // Start PREORDE main function
    yield {
        visual: { type: 'graph', nodes: snapshot([rootId]), edges: snapshotEdges() },
        variables: { wortel: rootId },
        highlightedLines: [3, 4],
        description: `Start PREORDE met wortel "${rootId}"`,
        callStack: getCallStack(),
    }

    // Main recursive function
    function* preOrderRecursive(v: string): Generator<AlgorithmFrame> {
        const LINE_OFFSET = 7

        callStack.push({
            id: `preorder-${v}-${callStack.length}`,
            name: 'PreOrdeRecursief',
            args: { v },
        })

        yield {
            visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
            variables: { v },
            highlightedLines: [LINE_OFFSET],
            description: `Aanroep PreOrdeRecursief(${v})`,
            callStack: getCallStack(),
        }

        // Visit the node
        visited.add(v)
        visitOrder.push(v)

        yield {
            visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
            variables: { v },
            highlightedLines: [LINE_OFFSET + 1],
            description: `Bezoek knoop "${v}" (visit functie aangeroepen)`,
            callStack: getCallStack(),
        }

        // Get children
        const kids = children[v] ?? []

        if (kids.length === 0) {
            yield {
                visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
                variables: { v, kinderen: [] },
                highlightedLines: [LINE_OFFSET + 2],
                description: `Knoop "${v}" heeft geen kinderen, klaar met deze recursie`,
                callStack: getCallStack(),
            }
        } else {
            yield {
                visual: { type: 'graph', nodes: snapshot([v, ...kids]), edges: snapshotEdges() },
                variables: { v, kinderen: kids },
                highlightedLines: [LINE_OFFSET + 2],
                description: `Knoop "${v}" heeft ${kids.length} kind(eren): ${kids.join(', ')}`,
                callStack: getCallStack(),
            }

            // Recursively visit each child
            for (const w of kids) {
                const edgeId = findEdge(edges, v, w)

                // Highlight edge to child
                activeEdges.add(edgeId)
                yield {
                    visual: { type: 'graph', nodes: snapshot([v, w]), edges: snapshotEdges() },
                    variables: { v, w, kinderen: kids },
                    highlightedLines: [LINE_OFFSET + 3],
                    description: `Ga recursief naar kind "${w}"`,
                    callStack: getCallStack(),
                }

                // Recursive call
                yield* preOrderRecursive(w)

                // Remove edge highlight after returning
                activeEdges.delete(edgeId)

                yield {
                    visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
                    variables: { v, w },
                    highlightedLines: [LINE_OFFSET + 3],
                    description: `Terug van recursie naar kind "${w}", ga verder met andere kinderen`,
                    callStack: getCallStack(),
                }
            }
        }

        yield {
            visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
            variables: { v },
            highlightedLines: [LINE_OFFSET + 4],
            description: `Alle kinderen van "${v}" bezocht, klaar met deze recursie`,
            callStack: getCallStack(),
        }

        callStack.pop()
    }

    // Start recursion from root
    yield* preOrderRecursive(rootId)

    // Final frame
    yield {
        visual: { type: 'graph', nodes: snapshot(), edges: snapshotEdges() },
        variables: { },
        highlightedLines: [5, 11],
        description: `Klaar! Pre-order volgorde: ${visitOrder.join(' → ')}`,
        callStack: getCallStack(),
    }
}

// Input data - Binaire boom example
const classicTree: PreOrderInput = {
    rootId: 'A',
    nodes: [
        { id: 'A', label: 'A', x: 400, y: 50 },
        { id: 'B', label: 'B', x: 250, y: 150 },
        { id: 'C', label: 'C', x: 550, y: 150 },
        { id: 'D', label: 'D', x: 150, y: 250 },
        { id: 'E', label: 'E', x: 350, y: 250 },
        { id: 'F', label: 'F', x: 500, y: 250 },
        { id: 'G', label: 'G', x: 600, y: 250 },
    ],
    edges: [
        { id: 'AB', source: 'A', target: 'B' },
        { id: 'AC', source: 'A', target: 'C' },
        { id: 'BD', source: 'B', target: 'D' },
        { id: 'BE', source: 'B', target: 'E' },
        { id: 'CF', source: 'C', target: 'F' },
        { id: 'CG', source: 'C', target: 'G' },
    ],
}

// Smaller tree for testing
const smallTree: PreOrderInput = {
    rootId: '1',
    nodes: [
        { id: '1', label: '1', x: 350, y: 80 },
        { id: '2', label: '2', x: 200, y: 180 },
        { id: '3', label: '3', x: 500, y: 180 },
        { id: '4', label: '4', x: 100, y: 280 },
        { id: '5', label: '5', x: 300, y: 280 },
    ],
    edges: [
        { id: '12', source: '1', target: '2' },
        { id: '13', source: '1', target: '3' },
        { id: '24', source: '2', target: '4' },
        { id: '25', source: '2', target: '5' },
    ],
}

export const preOrderDefinition = defineAlgorithm<PreOrderInput>({
    id: 'preorder',
    name: 'Preorde',
    category: 'tree',
    visualType: 'graph',
    defaultInputId: 'classic',
    showCallStack: true,
    inputs: [
        {
            id: 'classic',
            name: 'Binaire boom',
            input: classicTree,
        },
        {
            id: 'small',
            name: 'Kleine boom',
            input: smallTree,
        },
    ],
    pythonCode: pseudoCode,
    run,
})