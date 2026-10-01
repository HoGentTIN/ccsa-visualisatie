import { defineAlgorithm } from '@/algorithms/shared/types'
import type { AlgorithmFrame, GraphNodeState, GraphEdgeState } from '@/algorithms/shared/types'
import classicInput from './inputs/dijkstra-classic.json'
import smallInput from './inputs/dijkstra-small.json'

interface InputNode {
    id: string
    label: string
    x: number
    y: number
}

interface InputEdge {
    id: string
    source: string
    target: string
    weight: number
}

export interface DijkstraInput {
    nodes: InputNode[]
    edges: InputEdge[]
    startId: string
}

const pseudoCode = `# Invoer Een gewogen graaf 𝐺 = (𝑉, 𝐸) met positieve gewichten. Startknoop 𝑠; 𝑉 = {1, 2, … , 𝑛}.
# Uitvoer De array 𝐷 met 𝐷[𝑣] de kortste afstand van 𝑠 tot 𝑣; als 𝐷[𝑣] = ∞ dan is er geen pad van 𝑠 naar 𝑣.
function DIJKSTRA(𝐺, 𝑠)
    𝐷 ← [∞, ∞, … , ∞] # 𝑛 keer ∞
    𝐷[𝑠] ← 0 # kortste pad van 𝑠 naar zichzelf heeft lengte 0
    𝑄 ← 𝑉 # knopen waarvan kortste afstand nog niet is bepaald
    while 𝑄 ≠ ∅ do
        zoek 𝑣 ∈ 𝑄 waarvoor 𝐷[𝑣] minimaal is (voor knopen in 𝑄)
        verwijder 𝑣 uit 𝑄
        for all 𝑤 ∈ buren(𝑣) ∩ 𝑄 do
            if 𝐷[𝑤] > 𝐷[𝑣] + gewicht(𝑣, 𝑤) then
                𝐷[𝑤] ← 𝐷[𝑣] + gewicht(𝑣, 𝑤) # korter pad 𝑠 → 𝑤
    return 𝐷
end function`

// Build adjacency list
type Adjacency = Record<string, { id: string; to: string; weight: number }[]>

function buildAdjacency(nodeIds: string[], edges: InputEdge[]): Adjacency {
    const adj: Adjacency = {}
    for (const id of nodeIds) adj[id] = []
    for (const e of edges) {
        adj[e.source].push({ id: e.id, to: e.target, weight: e.weight })
        adj[e.target].push({ id: e.id, to: e.source, weight: e.weight })
    }
    return adj
}

function* run(input: DijkstraInput): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3
    const { nodes, edges, startId } = input
    const nodeIds = nodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, edges)

    // Initialize D array and Q set
    const D: Record<string, number> = {}
    const Q = new Set<string>(nodeIds)

    for (const id of nodeIds) {
        D[id] = Infinity
    }

    const fmt = (n: number) => (n === Infinity ? '∞' : String(n))

    const snapshot = (activeNode: string | null, processedNodes: Set<string>): GraphNodeState[] =>
        nodes.map(n => ({
            ...n,
            status: processedNodes.has(n.id)
                ? 'visited'
                : n.id === activeNode
                    ? 'active'
                    : 'unvisited',
            value: `D=${fmt(D[n.id])}`,
        }))

    const snapshotEdges = (activeEdgeId: string | null): GraphEdgeState[] =>
        edges.map(e => ({
            ...e,
            status: e.id === activeEdgeId ? 'active' : 'default',
        }))

    // Initialize D array
    yield {
        visual: { type: 'graph', nodes: snapshot(null, new Set()), edges: snapshotEdges(null) },
        variables: { D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])), s: startId },
        highlightedLines: [LINE_OFFSET + 1],
        description: `Initialiseer D array: alle afstanden op ∞`,
    }

    D[startId] = 0

    yield {
        visual: { type: 'graph', nodes: snapshot(startId, new Set()), edges: snapshotEdges(null) },
        variables: { D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])), s: startId },
        highlightedLines: [LINE_OFFSET + 2],
        description: `D[${startId}] ← 0 (afstand van startknoop naar zichzelf is 0)`,
    }

    // Initialize Q
    yield {
        visual: { type: 'graph', nodes: snapshot(null, new Set()), edges: snapshotEdges(null) },
        variables: { D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])), Q: [...Q] },
        highlightedLines: [LINE_OFFSET + 3],
        description: `Q ← V (alle knopen moeten nog verwerkt worden)`,
    }

    const processed = new Set<string>()

    // Main loop
    while (Q.size > 0) {
        yield {
            visual: { type: 'graph', nodes: snapshot(null, processed), edges: snapshotEdges(null) },
            variables: { D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])), Q: [...Q] },
            highlightedLines: [LINE_OFFSET + 4],
            description: `Controleer lus: Q ≠ ∅? (${Q.size} knopen over)`,
        }

        // Find v in Q with minimal D[v]
        let minNode: string | null = null
        let minDist = Infinity

        for (const id of Q) {
            if (D[id] < minDist) {
                minDist = D[id]
                minNode = id
            }
        }

        if (!minNode) break

        yield {
            visual: { type: 'graph', nodes: snapshot(minNode, processed), edges: snapshotEdges(null) },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
                Q: [...Q],
                v: minNode,
                'D[v]': fmt(D[minNode]),
            },
            highlightedLines: [LINE_OFFSET + 5],
            description: `Kies v="${minNode}" uit Q met minimale D[v]=${fmt(D[minNode])}`,
        }

        Q.delete(minNode)
        processed.add(minNode)

        yield {
            visual: { type: 'graph', nodes: snapshot(minNode, processed), edges: snapshotEdges(null) },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
                Q: [...Q],
                v: minNode,
            },
            highlightedLines: [LINE_OFFSET + 6],
            description: `Verwijder "${minNode}" uit Q (afstand definitief bepaald)`,
        }

        // Check all neighbours of v that are still in Q
        const neighbours = adj[minNode] || []

        yield {
            visual: { type: 'graph', nodes: snapshot(minNode, processed), edges: snapshotEdges(null) },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
                Q: [...Q],
                v: minNode,
                buren: neighbours.map(n => n.to),
            },
            highlightedLines: [LINE_OFFSET + 7],
            description: `Doorloop buren van "${minNode}" die nog in Q zitten`,
        }

        for (const { id: edgeId, to: w, weight } of neighbours) {
            if (!Q.has(w)) {
                yield {
                    visual: { type: 'graph', nodes: snapshot(minNode, processed), edges: snapshotEdges(edgeId) },
                    variables: {
                        D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
                        Q: [...Q],
                        v: minNode,
                        w,
                    },
                    highlightedLines: [LINE_OFFSET + 7],
                    description: `Buur "${w}" zit niet meer in Q, sla over`,
                }
                continue
            }

            const newDist = D[minNode] + weight

            yield {
                visual: { type: 'graph', nodes: snapshot(w, processed), edges: snapshotEdges(edgeId) },
                variables: {
                    D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
                    Q: [...Q],
                    v: minNode,
                    w,
                    gewicht: weight,
                    'D[w]': fmt(D[w]),
                    'D[v] + gewicht': newDist,
                },
                highlightedLines: [LINE_OFFSET + 8],
                description: `Controleer: D[${w}]=${fmt(D[w])} > D[${minNode}] + ${weight} = ${newDist}?`,
            }

            if (D[w] > newDist) {
                D[w] = newDist

                yield {
                    visual: { type: 'graph', nodes: snapshot(w, processed), edges: snapshotEdges(edgeId) },
                    variables: {
                        D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
                        Q: [...Q],
                        v: minNode,
                        w,
                        'D[w]': fmt(D[w]),
                    },
                    highlightedLines: [LINE_OFFSET + 9],
                    description: `JA! Update D[${w}] ← ${newDist} (korter pad gevonden via ${minNode})`,
                }
            } else {
                yield {
                    visual: { type: 'graph', nodes: snapshot(w, processed), edges: snapshotEdges(edgeId) },
                    variables: {
                        D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
                        Q: [...Q],
                        v: minNode,
                        w,
                    },
                    highlightedLines: [LINE_OFFSET + 8],
                    description: `NEE, D[${w}]=${fmt(D[w])} is al korter of gelijk, geen update`,
                }
            }
        }
    }

    // Final result
    yield {
        visual: { type: 'graph', nodes: snapshot(null, processed), edges: snapshotEdges(null) },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, fmt(D[id])])),
            result: 'Kortste afstanden bepaald',
        },
        highlightedLines: [LINE_OFFSET + 10, LINE_OFFSET + 11],
        description: `Klaar! Alle kortste afstanden vanaf "${startId}" zijn bepaald`,
    }
}

export const dijkstraDefinition = defineAlgorithm<DijkstraInput>({
    id: 'dijkstra',
    name: 'Dijkstra',
    category: 'graph',
    visualType: 'graph',
    defaultInputId: 'classic',
    inputs: [
        {
            id: 'classic',
            name: 'Classic graph',
            input: classicInput,
        },
        {
            id: 'small',
            name: 'Small graph',
            input: smallInput,
        },
    ],
    pythonCode: pseudoCode,
    run,
})