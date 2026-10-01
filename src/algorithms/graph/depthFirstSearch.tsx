import { defineAlgorithm } from '@/algorithms/shared/types'
import type {
    AlgorithmFrame,
    GraphNodeState,
    GraphEdgeState,
    CallStackFrame,
} from '@/algorithms/shared/types'
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
    weight?: number
}

export interface DepthFirstInput {
    nodes: InputNode[]
    edges: InputEdge[]
    startId: string
}

const pythonCode = `# Invoer Een gerichte of ongerichte graaf 𝐺 = (𝑉, 𝐸) met orde 𝑛 > 0. Een startknoop 𝑠; 𝑉 = {1, 2, … , 𝑛}.
# Uitvoer Een array 𝐷 met 𝐷[𝑣] = true asa er een pad bestaat van 𝑠 naar 𝑣.
function DIEPTEEERST(𝐺, 𝑠)
    𝐷 ← [false, false, … , false] # 𝑛 keer false
    DiepteEerstRecursief(𝐺, 𝑠, 𝐷)
    return 𝐷
end function

function DIEPTEEERSTRECuRSIEF(𝐺, 𝑣, 𝐷)
    𝐷[𝑣] ← true # markeer 𝑣
    for all 𝑤 ∈ buren(𝑣) do
        if 𝐷[𝑤] = false then # 𝑤 nog niet ontdekt
            DiepteEerstRecursief(𝐺, 𝑤, 𝐷)
        end if
    end for
end function`

type Adjacency = Record<string, { id: string; to: string }[]>

function buildAdjacency(nodeIds: string[], edges: InputEdge[]): Adjacency {
    const adj: Adjacency = {}
    for (const id of nodeIds) adj[id] = []
    for (const e of edges) {
        if (adj[e.source]) adj[e.source].push({ id: e.id, to: e.target })
        if (adj[e.target]) adj[e.target].push({ id: e.id, to: e.source })
    }
    return adj
}

function* run(input: DepthFirstInput): Generator<AlgorithmFrame> {
    const MAIN_OFFSET = 3   // function DIEPTEEERST(𝐺, 𝑠)
    const REC_OFFSET = 9    // function DIEPTEEERSTRECuRSIEF(𝐺, 𝑣, 𝐷)

    const { nodes, edges, startId } = input
    const nodeIds = nodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, edges)

    const D: Record<string, boolean> = {}
    for (const id of nodeIds) {
        D[id] = false
    }

    const discoveredEdges = new Set<string>()
    const callStack: CallStackFrame[] = []

    const getCallStack = () => [...callStack]

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

    // ── Hoofdfunctie DIEPTEEERST ────────────────────────────────────────────────

    // D ← [false, false, … , false]
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
        },
        highlightedLines: [MAIN_OFFSET + 1],
        description: 'Initialiseer 𝐷 ← [false, false, … , false] (alle knopen onontdekt).',
        callStack: getCallStack(),
    }

    if (!nodeIds.includes(startId)) {
        yield {
            visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
            },
            highlightedLines: [MAIN_OFFSET + 1],
            description: `Startknoop "${startId}" bestaat niet in de graaf — algoritme stopt.`,
            callStack: getCallStack(),
        }
        return
    }

    // DiepteEerstRecursief(𝐺, 𝑠, 𝐷)
    yield {
        visual: { type: 'graph', nodes: snapshotNodes([startId]), edges: snapshotEdges() },
        variables: {
            s: startId,
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
        },
        highlightedLines: [MAIN_OFFSET + 2],
        description: `Start recursieve zoektocht: DiepteEerstRecursief(𝐺, ${startId}, 𝐷).`,
        callStack: getCallStack(),
    }

    function* dfsRecursive(v: string): Generator<AlgorithmFrame> {
        const frameId = `dfs-${v}-${callStack.length}`
        callStack.push({
            id: frameId,
            name: 'DiepteEerstRecursief',
            args: { v },
        })

        const neighbours = adj[v] ?? []

        // Ingang van de recursieve functie
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            },
            highlightedLines: [REC_OFFSET],
            description: `Aanroep DiepteEerstRecursief(𝐺, ${v}, 𝐷).`,
            callStack: getCallStack(),
        }

        // 𝐷[𝑣] ← true
        D[v] = true

        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            },
            highlightedLines: [REC_OFFSET + 1],
            description: `Bezoek knoop "${v}" en markeer 𝐷[${v}] ← true.`,
            callStack: getCallStack(),
        }

        // for all 𝑤 ∈ buren(𝑣) do
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                buren: neighbours.map(n => n.to),
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            },
            highlightedLines: [REC_OFFSET + 2],
            description: `Doorloop alle buren van "${v}": [${neighbours.map(n => n.to).join(', ')}].`,
            callStack: getCallStack(),
        }

        for (const { id: edgeId, to: w } of neighbours) {
            const activeEdges = new Set<string>([edgeId])

            // if 𝐷[𝑤] = false …
            yield {
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes([v, w]),
                    edges: snapshotEdges(activeEdges),
                },
                variables: {
                    v,
                    w,
                    [`D[${w}]`]: D[w],
                    D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                },
                highlightedLines: [REC_OFFSET + 3],
                description: `Controleer buur "${w}": is 𝐷[${w}] = false (nog niet ontdekt)?`,
                callStack: getCallStack(),
            }

            if (!D[w]) {
                discoveredEdges.add(edgeId)

                // recursieve oproep
                yield {
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes([v, w]),
                        edges: snapshotEdges(activeEdges),
                    },
                    variables: {
                        v,
                        w,
                        D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                    },
                    highlightedLines: [REC_OFFSET + 4],
                    description: `JA: ga dieper via "${w}" met DiepteEerstRecursief(𝐺, ${w}, 𝐷).`,
                    callStack: getCallStack(),
                }

                yield* dfsRecursive(w)

                // terug uit recursieve oproep
                yield {
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes([v]),
                        edges: snapshotEdges(activeEdges),
                    },
                    variables: {
                        v,
                        w,
                        D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                    },
                    highlightedLines: [REC_OFFSET + 4],
                    description: `Terug uit de recursieve aanroep voor "${w}", ga verder met andere buren van "${v}".`,
                    callStack: getCallStack(),
                }
            } else {
                yield {
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes([v, w]),
                        edges: snapshotEdges(activeEdges),
                    },
                    variables: {
                        v,
                        w,
                        D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                    },
                    highlightedLines: [REC_OFFSET + 3],
                    description: `"${w}" was al ontdekt (𝐷[${w}] = true), dus geen recursieve oproep.`,
                    callStack: getCallStack(),
                }
            }
        }

        // einde for-lus
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            },
            highlightedLines: [REC_OFFSET + 5],
            description: `Klaar met alle buren van "${v}", keer terug naar de vorige aanroep (of hoofdfunctie).`,
            callStack: getCallStack(),
        }

        callStack.pop()
    }

    // Start recursie
    yield* dfsRecursive(startId)

    // return 𝐷
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
        },
        highlightedLines: [MAIN_OFFSET + 3, MAIN_OFFSET + 4],
        description: 'Klaar! 𝐷 geeft aan welke knopen bereikbaar zijn vanuit 𝑠 via diepte-eerst zoeken.',
        callStack: getCallStack(),
    }
}

export const depthFirstSearchDefinition = defineAlgorithm<DepthFirstInput>({
    id: 'depthFirstSearch',
    name: 'Diepte-eerst zoeken',
    category: 'graph',
    visualType: 'graph',
    defaultInputId: 'classic',
    showCallStack: true,
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
    pythonCode,
    run,
})