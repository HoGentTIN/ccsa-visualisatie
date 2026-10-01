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

export interface InOrderInput {
    nodes: TreeNode[]
    edges: TreeEdge[]
    rootId: string
}

const pseudoCode = `# Invoer Een binaire boom 𝑇 en een visit functie.
# Uitvoer De visit functie is aangeroepen voor elke top van 𝑇.
function INORDE(𝑇, visit)
    if 𝑇 ≠ ∅ then # controleer dat boom niet leeg is
        InOrdeRecursief(𝑇.wortel, visit) # start met de wortel
    end if
end function

function INORDERECursief(𝑣, visit)
    if 𝑣.links ≠ ∅ then
        InOrdeRecursief(𝑣.links, visit)
    end if
    visit(𝑣) # visit aanroepen tussen recursieve oproepen
    if 𝑣.rechts ≠ ∅ then
        InOrdeRecursief(𝑣.rechts, visit)
    end if
end function`

// Voor een binaire boom gaan we uit van maximaal 2 kinderen per knoop.
// We interpreteren het eerste kind als "links" en het tweede als "rechts".
function buildChildren(edges: TreeEdge[]): Record<string, string[]> {
    const children: Record<string, string[]> = {}
    for (const e of edges) {
        if (!children[e.source]) children[e.source] = []
        children[e.source].push(e.target)
    }
    return children
}

function findEdge(edges: TreeEdge[], from: string, to: string): string {
    return edges.find(e => e.source === from && e.target === to)?.id ?? ''
}

function* run(input: InOrderInput): Generator<AlgorithmFrame> {
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

    // Start INORDE hoofdfunctie
    yield {
        visual: { type: 'graph', nodes: snapshot([rootId]), edges: snapshotEdges() },
        variables: { wortel: rootId },
        highlightedLines: [3, 4],
        description: `Start INORDE met wortel "${rootId}"`,
        callStack: getCallStack(),
    }

    function* inOrderRecursive(v: string): Generator<AlgorithmFrame> {
        const LINE_OFFSET = 8

        callStack.push({
            id: `inorder-${v}-${callStack.length}`,
            name: 'InOrdeRecursief',
            args: { v },
        })

        yield {
            visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
            variables: { v },
            highlightedLines: [LINE_OFFSET],
            description: `Aanroep InOrdeRecursief(${v})`,
            callStack: getCallStack(),
        }

        const kids = children[v] ?? []
        const left = kids[0]
        const right = kids[1]

        // Linker kind (𝑣.links)
        if (left) {
            const edgeId = findEdge(edges, v, left)
            activeEdges.add(edgeId)

            yield {
                visual: { type: 'graph', nodes: snapshot([v, left]), edges: snapshotEdges() },
                variables: { v, links: left },
                highlightedLines: [LINE_OFFSET + 1, LINE_OFFSET + 2],
                description: `Ga eerst recursief naar linker kind "${left}"`,
                callStack: getCallStack(),
            }

            yield* inOrderRecursive(left)

            activeEdges.delete(edgeId)

            yield {
                visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
                variables: { v, links: left },
                highlightedLines: [LINE_OFFSET + 2],
                description: `Terug van linker kind "${left}"`,
                callStack: getCallStack(),
            }
        } else {
            yield {
                visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
                variables: { v, links: null },
                highlightedLines: [LINE_OFFSET + 1, LINE_OFFSET + 2],
                description: `Knoop "${v}" heeft geen linker kind`,
                callStack: getCallStack(),
            }
        }

        // visit(𝑣) tussen links en rechts
        visited.add(v)
        visitOrder.push(v)

        yield {
            visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
            variables: { v, visitOrder: [...visitOrder] },
            highlightedLines: [LINE_OFFSET + 3],
            description: `Bezoek knoop "${v}" (visit functie aangeroepen)`,
            callStack: getCallStack(),
        }

        // Rechter kind (𝑣.rechts)
        if (right) {
            const edgeId = findEdge(edges, v, right)
            activeEdges.add(edgeId)

            yield {
                visual: { type: 'graph', nodes: snapshot([v, right]), edges: snapshotEdges() },
                variables: { v, rechts: right },
                highlightedLines: [LINE_OFFSET + 4, LINE_OFFSET + 5],
                description: `Ga daarna recursief naar rechter kind "${right}"`,
                callStack: getCallStack(),
            }

            yield* inOrderRecursive(right)

            activeEdges.delete(edgeId)

            yield {
                visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
                variables: { v, rechts: right },
                highlightedLines: [LINE_OFFSET + 5],
                description: `Terug van rechter kind "${right}"`,
                callStack: getCallStack(),
            }
        } else {
            yield {
                visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
                variables: { v, rechts: null },
                highlightedLines: [LINE_OFFSET + 4, LINE_OFFSET + 5],
                description: `Knoop "${v}" heeft geen rechter kind`,
                callStack: getCallStack(),
            }
        }

        yield {
            visual: { type: 'graph', nodes: snapshot([v]), edges: snapshotEdges() },
            variables: { v },
            highlightedLines: [LINE_OFFSET + 6],
            description: `Klaar met InOrdeRecursief(${v})`,
            callStack: getCallStack(),
        }

        callStack.pop()
    }

    // Start recursie vanaf de wortel
    yield* inOrderRecursive(rootId)

    // Laatste frame
    yield {
        visual: { type: 'graph', nodes: snapshot(), edges: snapshotEdges() },
        variables: { visitOrder: [...visitOrder] },
        highlightedLines: [5, 13],
        description: `Klaar! In-order volgorde: ${visitOrder.join(' → ')}`,
        callStack: getCallStack(),
    }
}

// Voorbeeldinvoer — zelfde vorm als bij pre-order, maar de volgorde van kinderen
// bepaalt nu impliciet "links" (eerste) en "rechts" (tweede).
const classicTree: InOrderInput = {
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

const smallTree: InOrderInput = {
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

export const inOrderDefinition = defineAlgorithm<InOrderInput>({
    id: 'inorder',
    name: 'Inorde',
    category: 'tree',
    visualType: 'graph',
    defaultInputId: 'classic',
    showCallStack: true,
    inputs: [
        {
            id: 'classic',
            name: 'Binary tree',
            input: classicTree,
        },
        {
            id: 'small',
            name: 'Small tree',
            input: smallTree,
        },
    ],
    pythonCode: pseudoCode,
    run,
})