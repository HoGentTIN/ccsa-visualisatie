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
    // gewicht mag aanwezig zijn (we hergebruiken Dijkstra-input), maar wordt hier niet gebruikt
    weight?: number
}

export interface BreadthFirstInput {
    nodes: InputNode[]
    edges: InputEdge[]
    startId: string
}

const pythonCode = `# Invoer Een gerichte of ongerichte graaf 𝐺 = (𝑉, 𝐸) met orde 𝑛 > 0. Een startknoop 𝑠; 𝑉 = {1, 2, … , 𝑛}.
# Uitvoer Een array 𝐷 met 𝐷[𝑣] = true asa er een pad bestaat van 𝑠 naar 𝑣.
function BREEDTEEERST(𝐺, 𝑠)
    𝐷 ← [false, false, … , false] # 𝑛 keer false
    𝐷[𝑠] ← true # markeer 𝑠
    𝑄.init() # wachtrij van knopen
    𝑄.enqueue(𝑠)
    while 𝑄 ≠ ∅ do
        𝑣 ← 𝑄.dequeue()
        for all 𝑤 ∈ buren(𝑣) do
            if 𝐷[𝑤] = false then # 𝑤 nog niet ontdekt
                𝐷[𝑤] ← true
                𝑄.enqueue(𝑤)
    return 𝐷
end function`

type Adjacency = Record<string, { id: string; to: string }[]>

function buildAdjacency(nodeIds: string[], edges: InputEdge[]): Adjacency {
    const adj: Adjacency = {}
    for (const id of nodeIds) adj[id] = []
    for (const e of edges) {
        // ongerichte interpretatie: beide richtingen toevoegen
        if (adj[e.source]) adj[e.source].push({ id: e.id, to: e.target })
        if (adj[e.target]) adj[e.target].push({ id: e.id, to: e.source })
    }
    return adj
}

function* run(input: BreadthFirstInput): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3 // "function BREEDTEEERST(𝐺, 𝑠)" is de derde regel

    const { nodes, edges, startId } = input
    const nodeIds = nodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, edges)

    // 𝐷-array: bereikbaarheid vanaf 𝑠
    const D: Record<string, boolean> = {}
    for (const id of nodeIds) {
        D[id] = false
    }

    // Q: wachtrij (breedt eerst)
    const Q: string[] = []

    // Voor visualisatie: ontdekkingsranden
    const discoveredEdges = new Set<string>()

    const snapshotNodes = (activeNodes: string[] = []): GraphNodeState[] =>
        nodes.map(n => ({
            ...n,
            status: D[n.id]
                ? activeNodes.includes(n.id)
                    ? 'active'
                    : 'visited'
                : activeNodes.includes(n.id)
                    ? 'active'
                    : 'unvisited',
            value: D[n.id] ? 'D=true' : 'D=false',
        }))

    const snapshotEdges = (activeEdgeIds: Set<string> = new Set()): GraphEdgeState[] =>
        edges.map(e => ({
            ...e,
            status: discoveredEdges.has(e.id)
                ? 'path'
                : activeEdgeIds.has(e.id)
                    ? 'active'
                    : 'default',
        }))

    // ── Initialisatie ─────────────────────────────────────────────────────────────

    // 𝐷 ← [false, false, … , false]
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
        },
        highlightedLines: [LINE_OFFSET + 1],
        description: 'Initialiseer 𝐷 ← [false, false, … , false] (alle knopen onbereikbaar).',
    }

    if (!nodeIds.includes(startId)) {
        yield {
            visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
            },
            highlightedLines: [LINE_OFFSET + 2],
            description: `Startknoop "${startId}" bestaat niet in de graaf — algoritme stopt.`,
        }
        return
    }

    // 𝐷[𝑠] ← true
    D[startId] = true

    yield {
        visual: { type: 'graph', nodes: snapshotNodes([startId]), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
        },
        highlightedLines: [LINE_OFFSET + 2],
        description: `Zet 𝐷[${startId}] ← true: startknoop is ontdekt en bereikbaar.`,
    }

    // 𝑄.init()
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
            Q: [...Q],
        },
        highlightedLines: [LINE_OFFSET + 3],
        description: 'Initialiseer de wachtrij 𝑄 als leeg.',
    }

    // 𝑄.enqueue(𝑠)
    Q.push(startId)

    yield {
        visual: { type: 'graph', nodes: snapshotNodes([startId]), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
            Q: [...Q],
        },
        highlightedLines: [LINE_OFFSET + 4],
        description: `Voeg startknoop "${startId}" toe aan de wachtrij 𝑄.`,
    }

    // ── Hoofdlus ─────────────────────────────────────────────────────────────────

    while (Q.length > 0) {
        // while 𝑄 ≠ ∅ do
        yield {
            visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
                Q: [...Q],
            },
            highlightedLines: [LINE_OFFSET + 5],
            description: `Controleer while-voorwaarde: 𝑄 ≠ ∅? (|𝑄| = ${Q.length}).`,
        }

        const v = Q.shift() as string

        // 𝑣 ← 𝑄.dequeue()
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
                v,
                Q: [...Q],
            },
            highlightedLines: [LINE_OFFSET + 6],
            description: `Neem knoop v ← 𝑄.dequeue(): v = "${v}".`,
        }

        const neighbours = adj[v] ?? []

        // for all 𝑤 ∈ buren(𝑣) do
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
                v,
                buren: neighbours.map(n => n.to),
                Q: [...Q],
            },
            highlightedLines: [LINE_OFFSET + 7],
            description: `Doorloop alle buren van "${v}": [${neighbours.map(n => n.to).join(', ')}].`,
        }

        for (const { id: edgeId, to: w } of neighbours) {
            const activeEdges = new Set<string>([edgeId])

            // if 𝐷[𝑤] = false then …
            yield {
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes([v, w]),
                    edges: snapshotEdges(activeEdges),
                },
                variables: {
                    D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                    s: startId,
                    v,
                    w,
                    Q: [...Q],
                    [`D[${w}]`]: D[w],
                },
                highlightedLines: [LINE_OFFSET + 8],
                description: `Controleer buur "${w}": is 𝐷[${w}] = false (nog niet ontdekt)?`,
            }

            if (!D[w]) {
                // 𝐷[𝑤] ← true
                D[w] = true
                discoveredEdges.add(edgeId)

                yield {
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes([w]),
                        edges: snapshotEdges(activeEdges),
                    },
                    variables: {
                        D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                        s: startId,
                        v,
                        w,
                        Q: [...Q],
                    },
                    highlightedLines: [LINE_OFFSET + 9],
                    description: `JA: markeer "${w}" als ontdekt: 𝐷[${w}] ← true.`,
                }

                // 𝑄.enqueue(𝑤)
                Q.push(w)

                yield {
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes([w]),
                        edges: snapshotEdges(activeEdges),
                    },
                    variables: {
                        D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                        s: startId,
                        v,
                        w,
                        Q: [...Q],
                    },
                    highlightedLines: [LINE_OFFSET + 10],
                    description: `Voeg "${w}" toe aan de wachtrij 𝑄.`,
                }
            } else {
                yield {
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes([v, w]),
                        edges: snapshotEdges(activeEdges),
                    },
                    variables: {
                        D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                        s: startId,
                        v,
                        w,
                        Q: [...Q],
                    },
                    highlightedLines: [LINE_OFFSET + 8],
                    description: `"${w}" was al ontdekt (𝐷[${w}] = true), dus niets te doen.`,
                }
            }
        }
    }

    // while-voorwaarde faalt: Q is leeg
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
            Q: [...Q],
        },
        highlightedLines: [LINE_OFFSET + 5],
        description: '𝑄 is leeg: er zijn geen knopen meer om te bezoeken, lus stopt.',
    }

    // return 𝐷
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
        },
        highlightedLines: [LINE_OFFSET + 11, LINE_OFFSET + 12],
        description: 'Klaar! 𝐷 geeft aan welke knopen bereikbaar zijn vanuit 𝑠.',
    }
}

export const breadthFirstSearchDefinition = defineAlgorithm<BreadthFirstInput>({
    id: 'breadthFirstSearch',
    name: 'Breedte-eerst zoeken',
    category: 'graph',
    visualType: 'graph',
    defaultInputId: 'classic',
    inputs: [
        {
            id: 'classic',
            name: 'Graaf',
            input: classicInput,
        },
        {
            id: 'small',
            name: 'Kleine graaf',
            input: smallInput,
        },
    ],
    pythonCode,
    run,
})