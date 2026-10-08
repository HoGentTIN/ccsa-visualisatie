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

export interface TopologicalSortInput {
    nodes: InputNode[]
    edges: InputEdge[]
    // we negeren startId hier: topologische sortering werkt over de volledige (gerichte) graaf
}

const pythonCode = `# Invoer Een gerichte graaf 𝐺 = (𝑉, 𝐸) met orde 𝑛 > 0. De knopen zijn genummerd van 1 tot 𝑛, i.e. 𝑉 = {1, 2, … , 𝑛}.
# Uitvoer Een topologische sortering van 𝐺 indien mogelijk, false anders.
function SORTEERTOPOLOgISCH(𝐺)
    global cycleDetected ← false # globale variabele
    𝐷 ← [0, 0, … , 0] # 𝑛 keer 0
    𝑆 ← ∅ # 𝑆 is lege lijst
    for all 𝑠 ∈ 𝑉 do
        if 𝐷[𝑠] = 0 then # 𝑠 nog niet gezien
            DfsTopo(𝐺, 𝑠, 𝐷, 𝑆) # 𝑆 en 𝐷 referentieparameters
            if cycleDetected = true then # controleer op cykel
                return false
            end if
        end if
    end for
    return 𝑆
end function

function DFSTOPO(𝐺, 𝑣, 𝐷, 𝑆)
    𝐷[𝑣] ← 1 # markeer 𝑣 als ‘bezig’
    for all 𝑤 ∈ buren(𝑣) do
        if 𝐷[𝑤] = 0 ∧ cycleDetected = false then # 𝑤 nog niet ontdekt
            DfsTopo(𝐺, 𝑤, 𝐷, 𝑆)
        else if 𝐷[𝑤] = 1 then # cykel ontdekt 𝑣 → 𝑤
            cycleDetected ← true
        end if
    end for
    𝐷[𝑣] ← 2 # markeer 𝑣 als ‘voltooid’
    voeg 𝑣 vooraan toe aan 𝑆 # ken rangnummer toe aan 𝑣
end function`

type Adjacency = Record<string, { id: string; to: string }[]>

function buildAdjacency(nodes: InputNode[], edges: InputEdge[]): Adjacency {
    const adj: Adjacency = {}
    for (const n of nodes) adj[n.id] = []
    for (const e of edges) {
        // Topologische sortering: we interpreteren de boog als gericht van source → target
        if (adj[e.source]) adj[e.source].push({ id: e.id, to: e.target })
    }
    return adj
}

function* run(input: TopologicalSortInput): Generator<AlgorithmFrame> {
    const MAIN_OFFSET = 3   // function SORTEERTOPOLOgISCH(𝐺)
    const REC_OFFSET = 18   // function DFSTOPO(𝐺, 𝑣, 𝐷, 𝑆)

    const { nodes, edges } = input
    const nodeIds = nodes.map(n => n.id)
    const adj = buildAdjacency(nodes, edges)

    // D-status: 0 = onzicht / niet gezien, 1 = bezig, 2 = voltooid
    const D: Record<string, 0 | 1 | 2> = {}
    for (const id of nodeIds) {
        D[id] = 0
    }

    let cycleDetected = false
    const S: string[] = []          // uiteindelijke topologische volgorde (vooraan invoegen)
    const discoveredEdges = new Set<string>()
    const callStack: CallStackFrame[] = []

    const getCallStack = () => [...callStack]

    const snapshotNodes = (activeNodes: string[] = []): GraphNodeState[] =>
        nodes.map(n => ({
            ...n,
            status: S.includes(n.id)
                ? 'path'        // al in de topologische volgorde
                : D[n.id] === 1
                    ? 'active'  // bezig in de recursieve stapel
                    : D[n.id] === 2
                        ? 'visited' // voltooid maar nog niet in S? (hier overlapt met path)
                        : activeNodes.includes(n.id)
                            ? 'active'
                            : 'unvisited',
            value: S.includes(n.id)
                ? `S=${S.indexOf(n.id) + 1}` // rang in topologische volgorde
                : `D=${D[n.id]}`,
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

    // ── Hulpfunctie voor de recursieve DFS ───────────────────────────────────────

    function* dfsTopo(v: string): Generator<AlgorithmFrame> {
        const frameId = `topo-${v}-${callStack.length}`
        callStack.push({
            id: frameId,
            name: 'DfsTopo',
            args: { v },
        })

        const neighbours = adj[v] ?? []

        // Ingang van DFSTOPO
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                S: [...S],
                cycleDetected,
            },
            highlightedLines: [REC_OFFSET],
            description: `Aanroep DfsTopo(𝐺, ${v}, 𝐷, 𝑆).`,
            callStack: getCallStack(),
        }

        // 𝐷[𝑣] ← 1
        D[v] = 1

        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                S: [...S],
                cycleDetected,
            },
            highlightedLines: [REC_OFFSET + 1],
            description: `Markeer knoop "${v}" als bezig: 𝐷[${v}] ← 1.`,
            callStack: getCallStack(),
        }

        // for all 𝑤 ∈ buren(𝑣) do
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                buren: neighbours.map(n => n.to),
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                S: [...S],
                cycleDetected,
            },
            highlightedLines: [REC_OFFSET + 2],
            description: `Doorloop alle buren van "${v}": [${neighbours.map(n => n.to).join(', ')}].`,
            callStack: getCallStack(),
        }

        for (const { id: edgeId, to: w } of neighbours) {
            const activeEdges = new Set<string>([edgeId])

            // if 𝐷[𝑤] = 0 ∧ cycleDetected = false …
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
                    cycleDetected,
                    D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                    S: [...S],
                },
                highlightedLines: [REC_OFFSET + 3],
                description: `Controleer buur "${w}": is 𝐷[${w}] = 0 en nog geen cykel gedetecteerd?`,
                callStack: getCallStack(),
            }

            if (D[w] === 0 && !cycleDetected) {
                discoveredEdges.add(edgeId)

                // DfsTopo(𝐺, 𝑤, 𝐷, 𝑆)
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
                        S: [...S],
                        cycleDetected,
                    },
                    highlightedLines: [REC_OFFSET + 4],
                    description: `JA: roep DfsTopo(𝐺, ${w}, 𝐷, 𝑆) recursief aan.`,
                    callStack: getCallStack(),
                }

                yield* dfsTopo(w)

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
                        S: [...S],
                        cycleDetected,
                    },
                    highlightedLines: [REC_OFFSET + 4],
                    description: `Terug uit DfsTopo voor "${w}", ga verder met andere buren van "${v}".`,
                    callStack: getCallStack(),
                }
            } else if (D[w] === 1) {
                // else if 𝐷[𝑤] = 1 then … cykel ontdekt
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
                        S: [...S],
                        cycleDetected,
                    },
                    highlightedLines: [REC_OFFSET + 5, REC_OFFSET + 6],
                    description: `Cykel ontdekt via boog ${v} → ${w} (𝐷[${w}] = 1).`,
                    callStack: getCallStack(),
                }

                cycleDetected = true

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
                        S: [...S],
                        cycleDetected,
                    },
                    highlightedLines: [REC_OFFSET + 6],
                    description: `Zet cycleDetected ← true (topologische sortering niet mogelijk).`,
                    callStack: getCallStack(),
                }
            } else {
                // buur al gezien of cykel al gevonden
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
                        S: [...S],
                        cycleDetected,
                    },
                    highlightedLines: [REC_OFFSET + 3],
                    description: `"${w}" is al verwerkt of er is al een cykel, geen recursieve oproep meer.`,
                    callStack: getCallStack(),
                }
            }
        }

        // 𝐷[𝑣] ← 2
        D[v] = 2

        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                S: [...S],
                cycleDetected,
            },
            highlightedLines: [REC_OFFSET + 8],
            description: `Markeer knoop "${v}" als voltooid: 𝐷[${v}] ← 2.`,
            callStack: getCallStack(),
        }

        // voeg 𝑣 vooraan toe aan 𝑆
        S.unshift(v)

        yield {
            visual: { type: 'graph', nodes: snapshotNodes([v]), edges: snapshotEdges() },
            variables: {
                v,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                S: [...S],
                cycleDetected,
            },
            highlightedLines: [REC_OFFSET + 9],
            description: `Voeg "${v}" vooraan toe aan 𝑆 (rangnummer toegekend).`,
            callStack: getCallStack(),
        }

        callStack.pop()
    }

    // ── Hoofdfunctie loop over alle knopen ───────────────────────────────────────

    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            S: [...S],
            cycleDetected,
        },
        highlightedLines: [MAIN_OFFSET + 2, MAIN_OFFSET + 3],
        description: 'Initialiseer cycleDetected, 𝐷 en lege lijst 𝑆.',
        callStack: getCallStack(),
    }

    for (const s of nodeIds) {
        // for all 𝑠 ∈ 𝑉 do
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([s]), edges: snapshotEdges() },
            variables: {
                s,
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                S: [...S],
                cycleDetected,
            },
            highlightedLines: [MAIN_OFFSET + 4],
            description: `Beschouw knoop s="${s}".`,
            callStack: getCallStack(),
        }

        // if 𝐷[𝑠] = 0 then …
        yield {
            visual: { type: 'graph', nodes: snapshotNodes([s]), edges: snapshotEdges() },
            variables: {
                s,
                [`D[${s}]`]: D[s],
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                S: [...S],
                cycleDetected,
            },
            highlightedLines: [MAIN_OFFSET + 5],
            description: `Controleer of 𝐷[${s}] = 0 (nog niet gezien).`,
            callStack: getCallStack(),
        }

        if (D[s] === 0) {
            // DfsTopo(𝐺, 𝑠, 𝐷, 𝑆)
            yield {
                visual: { type: 'graph', nodes: snapshotNodes([s]), edges: snapshotEdges() },
                variables: {
                    s,
                    D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                    S: [...S],
                    cycleDetected,
                },
                highlightedLines: [MAIN_OFFSET + 6],
                description: `Start DFS-topo vanaf "${s}" met DfsTopo(𝐺, ${s}, 𝐷, 𝑆).`,
                callStack: getCallStack(),
            }

            yield* dfsTopo(s)

            // if cycleDetected = true then return false
            yield {
                visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
                variables: {
                    s,
                    D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                    S: [...S],
                    cycleDetected,
                },
                highlightedLines: [MAIN_OFFSET + 7],
                description: `Controleer na DfsTopo of cycleDetected = true.`,
                callStack: getCallStack(),
            }

            if (cycleDetected) {
                yield {
                    visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
                    variables: {
                        s,
                        D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                        S: [...S],
                        cycleDetected,
                        result: false,
                    },
                    highlightedLines: [MAIN_OFFSET + 7, MAIN_OFFSET + 8],
                    description: 'Cykel gedetecteerd: topologische sortering niet mogelijk, return false.',
                    callStack: getCallStack(),
                }
                return
            }
        }
    }

    // return 𝑆
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            S: [...S],
            cycleDetected,
            result: [...S],
        },
        highlightedLines: [MAIN_OFFSET + 11, MAIN_OFFSET + 12],
        description: `Klaar! Topologische volgorde gevonden: [${S.join(' → ')}].`,
        callStack: getCallStack(),
    }
}

export const topologicalSortDefinition = defineAlgorithm<TopologicalSortInput>({
    id: 'topologicalSort',
    name: 'Topologisch sorteren',
    category: 'graph',
    visualType: 'graph',
    defaultInputId: 'classic',
    showCallStack: true,
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