import { defineAlgorithm } from '@/algorithms/shared/types'
import type { AlgorithmFrame, GraphNodeState, GraphEdgeState } from '@/algorithms/shared/types'
import classicInput from './inputs/prim-classic.json'
import smallInput from './inputs/prim-small.json'

interface InputNode { id: string; label: string; x: number; y: number }
interface InputEdge { id: string; source: string; target: string; weight: number }

export interface PrimInput {
    nodes: InputNode[]
    edges: InputEdge[]
}

const pythonCode = `# Invoer Een ongerichte gewogen graaf 𝐺 = (𝑉 , 𝐸) met orde 𝑛 > 0. De knopen zijn
# genummerd van 1 tot 𝑛, i.e. 𝑉 = {1, 2, … , 𝑛}.
# Uitvoer Een verzameling 𝑇 van bogen die een minimale kost opspannende boom is.
function PRIM(𝐺)
    𝐷 ← [false, false, … , false]
    𝐷[1] ← true
    𝑇 ← ∅
    while ∃(𝑢, 𝑣) ∶ 𝐷[𝑢] = true ∧ 𝐷[𝑣] = false do
        kies (𝑢, 𝑣) met 𝐷[𝑢] = true ∧ 𝐷[𝑣] = false met minimaal gewicht
        𝐷[𝑣] ← true
        𝑇 ← 𝑇 ∪ {(𝑢, 𝑣)}
    end while
    return T
end function`

type AdjacencyEdge = { id: string; source: string; target: string; weight: number }

function buildAdjacency(nodeIds: string[], edges: AdjacencyEdge[]) {
    const adj: Record<string, { id: string; to: string; weight: number }[]> = {}
    for (const id of nodeIds) adj[id] = []

    for (const e of edges) {
        adj[e.source].push({ id: e.id, to: e.target, weight: e.weight })
        adj[e.target].push({ id: e.id, to: e.source, weight: e.weight })
    }

    return adj
}

function* run(input: PrimInput): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 4 // "function PRIM(G)" is line 4 in pythonCode

    const { nodes, edges } = input
    const nodeIds = nodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, edges)

    const visited = new Set<string>()   // D[i] = true/false
    const mstEdges = new Set<string>()  // T = verzameling van bogen

    const snapshotNodes = (activeNodes: string[] = []): GraphNodeState[] =>
        nodes.map(n => ({
            ...n,
            status: mstEdges.has(
                // node is incident to any mst edge → mark as path
                edges.find(e =>
                    mstEdges.has(e.id) && (e.source === n.id || e.target === n.id),
                )?.id ?? '',
            )
                ? 'path'
                : visited.has(n.id)
                    ? 'visited'
                    : activeNodes.includes(n.id)
                        ? 'active'
                        : 'unvisited',
        }))

    const snapshotEdges = (activeEdgeIds: Set<string> = new Set()): GraphEdgeState[] =>
        edges.map(e => ({
            ...e,
            status: mstEdges.has(e.id)
                ? 'path'
                : activeEdgeIds.has(e.id)
                    ? 'active'
                    : 'default',
        }))

    if (nodeIds.length === 0) {
        yield {
            visual: { type: 'graph', nodes: [], edges: [] },
            variables: { T: [] },
            highlightedLines: [LINE_OFFSET],
            description: 'Lege graaf: geen knopen, dus geen boom.',
        }
        return
    }

    // ── Initialisatie D en T ───────────────────────────────────────────────────

    // D ← [false, false, …, false]
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            D: Object.fromEntries(nodeIds.map(id => [id, false])),
            T: [],
        },
        highlightedLines: [LINE_OFFSET + 1],
        description: 'Initialiseer 𝐷 ← [false, false, … , false] (geen enkele knoop in de boom).',
    }

    // Start with node 1 if present, otherwise first node in input
    const startId = nodeIds[0]
    visited.add(startId)

    // D[1] ← true
    yield {
        visual: { type: 'graph', nodes: snapshotNodes([startId]), edges: snapshotEdges() },
        variables: {
            start: startId,
            D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
            T: [],
        },
        highlightedLines: [LINE_OFFSET + 2],
        description: `Zet 𝐷[${startId}] ← true: startknoop "${startId}" is in de boom.`,
    }

    // T ← ∅
    yield {
        visual: { type: 'graph', nodes: snapshotNodes([startId]), edges: snapshotEdges() },
        variables: {
            start: startId,
            D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
            T: [],
        },
        highlightedLines: [LINE_OFFSET + 3],
        description: 'Initialiseer 𝑇 ← ∅ (nog geen bogen in de boom).',
    }

    // ── Hoofdlus ────────────────────────────────────────────────────────────────
    while (true) {
        // while ∃(u, v) … ?
        yield {
            visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
            variables: {
                D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
                T: [...mstEdges],
            },
            highlightedLines: [LINE_OFFSET + 4],
            description:
                'Controleer: bestaat er een boog (u, v) met 𝐷[u] = true en 𝐷[v] = false?',
        }

        let best: { from: string; to: string; edgeId: string; weight: number } | null = null
        const consideredEdges = new Set<string>()

        // Doorloop alle bogen met één uiteinde in de boom en het andere erbuiten
        for (const u of visited) {
            for (const { id: edgeId, to: v, weight } of adj[u]) {
                if (visited.has(v)) continue
                consideredEdges.add(edgeId)

                // Toon dat we deze rand overwegen
                yield {
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes([u, v]),
                        edges: snapshotEdges(new Set([edgeId])),
                    },
                    variables: {
                        u,
                        v,
                        weight,
                        best: best
                            ? { from: best.from, to: best.to, weight: best.weight }
                            : null,
                        D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
                        T: [...mstEdges],
                    },
                    highlightedLines: [LINE_OFFSET + 5],
                    description: `Overweeg boog (${u}, ${v}) met gewicht ${weight} als kandidaat.`,
                }

                if (!best || weight < best.weight) {
                    best = { from: u, to: v, edgeId, weight }

                    // Toon update van "beste" rand tot nu toe
                    yield {
                        visual: {
                            type: 'graph',
                            nodes: snapshotNodes([u, v]),
                            edges: snapshotEdges(new Set([edgeId])),
                        },
                        variables: {
                            u,
                            v,
                            weight,
                            best: { from: best.from, to: best.to, weight: best.weight },
                            D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
                            T: [...mstEdges],
                        },
                        highlightedLines: [LINE_OFFSET + 5],
                        description: `Nieuwe beste boog: (${u}, ${v}) met gewicht ${weight}.`,
                    }
                }
            }
        }

        if (!best) {
            // while-voorwaarde faalt → geen (u, v) meer
            yield {
                visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
                variables: {
                    D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
                    T: [...mstEdges],
                },
                highlightedLines: [LINE_OFFSET + 4],
                description:
                    'Geen boog (u, v) meer met 𝐷[u] = true en 𝐷[v] = false → lus stopt.',
            }
            break
        }

        // kies (u, v) met minimaal gewicht
        yield {
            visual: {
                type: 'graph',
                nodes: snapshotNodes([best.from, best.to]),
                edges: snapshotEdges(new Set([best.edgeId])),
            },
            variables: {
                u: best.from,
                v: best.to,
                weight: best.weight,
                D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
                T: [...mstEdges],
            },
            highlightedLines: [LINE_OFFSET + 5],
            description: `Kies boog (${best.from}, ${best.to}) met minimaal gewicht ${best.weight}.`,
        }

        // 𝐷[v] ← true
        visited.add(best.to)
        yield {
            visual: {
                type: 'graph',
                nodes: snapshotNodes([best.to]),
                edges: snapshotEdges(new Set([best.edgeId])),
            },
            variables: {
                u: best.from,
                v: best.to,
                weight: best.weight,
                D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
                T: [...mstEdges],
            },
            highlightedLines: [LINE_OFFSET + 6],
            description: `Zet 𝐷[${best.to}] ← true: knoop "${best.to}" wordt toegevoegd aan de boom.`,
        }

        // 𝑇 ← 𝑇 ∪ {(u, v)}
        mstEdges.add(best.edgeId)
        yield {
            visual: {
                type: 'graph',
                nodes: snapshotNodes(),
                edges: snapshotEdges(new Set([best.edgeId])),
            },
            variables: {
                u: best.from,
                v: best.to,
                weight: best.weight,
                D: Object.fromEntries(nodeIds.map(id => [id, visited.has(id)])),
                T: [...mstEdges],
            },
            highlightedLines: [LINE_OFFSET + 7],
            description: `Voeg boog (${best.from}, ${best.to}) toe aan 𝑇.`,
        }
    }

    // return T
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            T: [...mstEdges],
        },
        highlightedLines: [LINE_OFFSET + 8, LINE_OFFSET + 9],
        description: 'Klaar! Minimum spanning tree gevonden; return 𝑇.',
    }
}

export const primDefinition = defineAlgorithm<PrimInput>({
    id: 'prim',
    name: "Prim's",
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