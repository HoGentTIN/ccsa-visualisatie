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
    // eventueel aanwezig (we hergebruiken Dijkstra-input), maar niet gebruikt in dit algoritme
    weight?: number
}

export interface GenericSearchInput {
    nodes: InputNode[]
    edges: InputEdge[]
    startId: string
}

const pythonCode = `# Invoer Een gerichte of ongerichte graaf 𝐺 = (𝑉, 𝐸) met orde 𝑛 > 0. Een knoop 𝑠 waarvan het zoeken vertrekt. De knopen zijn genummerd van 1 tot 𝑛, i.e. 𝑉 = {1, 2, … , 𝑛}.
# Uitvoer Een array 𝐷 met 𝐷[𝑣] = true als en slechts als er een pad bestaat van 𝑠 naar 𝑣.
function ZOEKGENERIEK(𝐺, 𝑠)
    𝐷 ← [false, false, … , false] # 𝑛 keer false
    𝐷[𝑠] ← true # markeer 𝑠
    while ∃(𝑢, 𝑣) ∶ 𝐷[𝑢] = true ∧ 𝐷[𝑣] = false do
        kies een boog (𝑢, 𝑣) met 𝐷[𝑢] = true ∧ 𝐷[𝑣] = false
        𝐷[𝑣] ← true # markeer 𝑣
    end while
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

function* run(input: GenericSearchInput): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3 // "function ZOEKGENERIEK" is de derde regel

    const { nodes, edges, startId } = input
    const nodeIds = nodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, edges)

    // 𝐷-array: bereikbaarheid vanaf s
    const D: Record<string, boolean> = {}
    for (const id of nodeIds) {
        D[id] = false
    }

    // Voor visualisatie: welke randen zijn gebruikt als "ontdekkingsranden"
    const discoveredEdges = new Set<string>()

    const snapshotNodes = (activeNodes: string[] = []): GraphNodeState[] =>
        nodes.map(n => ({
            ...n,
            status: D[n.id]
                ? discoveredEdges.size > 0 && activeNodes.includes(n.id)
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
            description: `Startknoop "${startId}" bestaat niet in de graaf — stoppen.`,
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
        description: `Zet 𝐷[${startId}] ← true: startknoop is bereikbaar.`,
    }

    // ── Hoofdlus ─────────────────────────────────────────────────────────────────

    while (true) {
        // while ∃(𝑢, 𝑣) … ?
        // Zoek eerst alle kandidaten (u, v) met D[u]=true en D[v]=false
        const candidates: { u: string; v: string; edgeId: string }[] = []

        for (const u of nodeIds) {
            if (!D[u]) continue
            for (const { id: edgeId, to: v } of adj[u] ?? []) {
                if (!D[v]) {
                    candidates.push({ u, v, edgeId })
                }
            }
        }

        yield {
            visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
                kandidaten: candidates.map(c => `(${c.u}, ${c.v})`),
            },
            highlightedLines: [LINE_OFFSET + 3],
            description: candidates.length > 0
                ? 'Controleer while-voorwaarde: er bestaan nog bogen (u, v) met 𝐷[u] = true en 𝐷[v] = false.'
                : 'Geen bogen (u, v) meer met 𝐷[u] = true en 𝐷[v] = false → lus stopt.',
        }

        if (candidates.length === 0) {
            break
        }

        // kies een boog (u, v) …
        // Voor determinisme: neem de eerste kandidaat
        const { u, v, edgeId } = candidates[0]

        yield {
            visual: {
                type: 'graph',
                nodes: snapshotNodes([u, v]),
                edges: snapshotEdges(new Set([edgeId])),
            },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
                u,
                v,
            },
            highlightedLines: [LINE_OFFSET + 4],
            description: `Kies boog (${u}, ${v}) met 𝐷[${u}] = true en 𝐷[${v}] = false.`,
        }

        // 𝐷[𝑣] ← true
        D[v] = true
        discoveredEdges.add(edgeId)

        yield {
            visual: {
                type: 'graph',
                nodes: snapshotNodes([v]),
                edges: snapshotEdges(new Set([edgeId])),
            },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
                s: startId,
                u,
                v,
            },
            highlightedLines: [LINE_OFFSET + 5],
            description: `Markeer knoop "${v}" bereikbaar: 𝐷[${v}] ← true.`,
        }
    }

    // return 𝐷
    yield {
        visual: {
            type: 'graph',
            nodes: snapshotNodes(),
            edges: snapshotEdges(),
        },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, D[id]])),
            s: startId,
        },
        highlightedLines: [LINE_OFFSET + 6, LINE_OFFSET + 7],
        description: 'Klaar! 𝐷 geeft nu voor elke knoop aan of ze bereikbaar is vanuit 𝑠.',
    }
}

export const genericSearchDefinition = defineAlgorithm<GenericSearchInput>({
    id: 'genericSearch',
    name: 'Generiek zoeken',
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
    pythonCode,
    run,
})