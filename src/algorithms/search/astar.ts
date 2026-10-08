import { defineAlgorithm } from '@/algorithms/shared/types'
import type { AlgorithmFrame, GraphEdgeState, GraphNodeState } from '@/algorithms/shared/types'

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

import classicInput from './inputs/astar-classic.json'
import smallInput from './inputs/astar-small.json'
import astarRomaniaInput from './inputs/astar-romania.json'

export interface AStarInput {
    nodes: InputNode[]
    edges: InputEdge[]
    startId: string
    endId: string
    heuristic: Record<string, number>
}

const pythonCode = `# Invoer Een gewogen graaf 𝐺 = (𝑉, 𝐸), een startknoop 𝑠 en een doelknoop 𝑡.
# Voor elke knoop 𝑣 is er een heuristische schatting ℎ(𝑣) van de afstand tot 𝑡.
# Uitvoer Een kortste pad van 𝑠 naar 𝑡.
function A*(G, s, t)
    open ← {s}
    closed ← ∅
    g[s] ← 0
    f[s] ← h(s)
    while open ≠ ∅ do
        kies v uit open met minimale f[v]
        if v = t then
            return reconstructie van het pad
        verplaats v van open naar closed
        for elke buur w van v do
            if w ∈ closed then
                continue
            tentative ← g[v] + gewicht(v, w)
            if w ∉ open of tentative < g[w] then
                ouder[w] ← v
                g[w] ← tentative
                f[w] ← g[w] + h(w)
                voeg w toe aan open
    return geen pad
 end function`

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

function findEdgeId(edges: InputEdge[], a: string, b: string): string {
    return edges.find(e =>
        (e.source === a && e.target === b) ||
        (e.source === b && e.target === a)
    )?.id ?? ''
}

function* run(input: AStarInput): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 4
    const { nodes: inputNodes, edges: inputEdges, startId, endId, heuristic } = input
    const nodeIds = inputNodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, inputEdges)

    // Initialize data structures
    const open = new Set<string>()
    const closed = new Set<string>()
    const g: Record<string, number> = {}
    const f: Record<string, number> = {}
    const parent: Record<string, string | null> = {}

    // Initialize all nodes
    for (const id of nodeIds) {
        g[id] = Infinity
        f[id] = Infinity
        parent[id] = null
    }

    const fmt = (n: number) => (n === Infinity ? '∞' : String(n))

    // Helper: basisvariabelen object (zonder volledige g/f/h-tabellen)
    const makeVars = (extra: Record<string, unknown> = {}) => ({
        open: [...open],
        closed: [...closed],
        ...extra,
    })

    const reconstructPath = (): Set<string> => {
        const path = new Set<string>()
        let curr: string | null = endId
        while (curr && parent[curr]) {
            const p: string = parent[curr]!
            const eid = findEdgeId(inputEdges, p, curr)
            if (eid) path.add(eid)
            curr = p
        }
        return path
    }

    const snapNodes = (activeId: string | null, pathNodeIds: Set<string>): GraphNodeState[] =>
        inputNodes.map(n => ({
            ...n,
            status: pathNodeIds.has(n.id)
                ? 'path'
                : n.id === activeId
                    ? 'active'
                    : closed.has(n.id)
                        ? 'visited'
                        : open.has(n.id)
                            ? 'active'
                            : 'unvisited',
            value: `g=${fmt(g[n.id])}, f=${fmt(f[n.id])}`,
        }))

    const snapEdges = (activeEdgeIds: Set<string>, pathEdges: Set<string>): GraphEdgeState[] =>
        inputEdges.map(e => ({
            ...e,
            status: pathEdges.has(e.id)
                ? 'path'
                : activeEdgeIds.has(e.id)
                    ? 'active'
                    : 'default',
        }))

    const graphVisual = (
        nodes: GraphNodeState[],
        edges: GraphEdgeState[],
    ) => ({
        type: 'graph' as const,
        nodes,
        edges,
        heuristic,
    })

    // Line 5: open ← {s}
    open.add(startId)
    yield {
        visual: graphVisual(snapNodes(startId, new Set()), snapEdges(new Set(), new Set())),
        variables: makeVars({ s: startId, t: endId }),
        highlightedLines: [LINE_OFFSET + 1],
        description: `Initialiseer open ← {${startId}} (startknoop)`,
    }

    // Line 6: closed ← ∅
    yield {
        visual: graphVisual(snapNodes(startId, new Set()), snapEdges(new Set(), new Set())),
        variables: makeVars({ s: startId, t: endId }),
        highlightedLines: [LINE_OFFSET + 2],
        description: `Initialiseer closed ← ∅ (geen knopen bezocht)`,
    }

    // Line 7: g[s] ← 0
    g[startId] = 0
    yield {
        visual: graphVisual(snapNodes(startId, new Set()), snapEdges(new Set(), new Set())),
        variables: makeVars({ s: startId, t: endId, [`g[${startId}]`]: fmt(g[startId]) }),
        highlightedLines: [LINE_OFFSET + 3],
        description: `g[${startId}] ← 0 (afstand van start naar zichzelf)`,
    }

    // Line 8: f[s] ← h(s)
    f[startId] = heuristic[startId] ?? 0
    yield {
        visual: graphVisual(snapNodes(startId, new Set()), snapEdges(new Set(), new Set())),
        variables: makeVars({
            s: startId,
            t: endId,
            [`h(${startId})`]: heuristic[startId] ?? 0,
            [`f[${startId}]`]: fmt(f[startId]),
        }),
        highlightedLines: [LINE_OFFSET + 4],
        description: `f[${startId}] ← h(${startId}) = ${heuristic[startId] ?? 0} (geschatte totale kost)`,
    }

    // Main loop
    while (open.size > 0) {
        yield {
            visual: graphVisual(snapNodes(null, new Set()), snapEdges(new Set(), new Set())),
            variables: makeVars({ 'open.size': open.size }),
            highlightedLines: [LINE_OFFSET + 5],
            description: `Controleer lus: open ≠ ∅? (${open.size} knopen in open)`,
        }

        // Line 10: kies v uit open met minimale f[v]
        let current = ''
        let best = Infinity

        for (const id of open) {
            if (f[id] < best) {
                best = f[id]
                current = id
            }
        }

        if (!current) break

        yield {
            visual: graphVisual(snapNodes(current, new Set()), snapEdges(new Set(), new Set())),
            variables: makeVars({ v: current, [`f[${current}]`]: fmt(f[current]) }),
            highlightedLines: [LINE_OFFSET + 6],
            description: `Kies v="${current}" uit open met minimale f[v]=${fmt(f[current])}`,
        }

        // Line 11-12: if v = t then return
        yield {
            visual: graphVisual(snapNodes(current, new Set()), snapEdges(new Set(), new Set())),
            variables: makeVars({ v: current, t: endId, 'v = t': current === endId }),
            highlightedLines: [LINE_OFFSET + 7],
            description: `Controleer: v="${current}" = t="${endId}"?`,
        }

        if (current === endId) {
            const pathEdges = reconstructPath()
            const pathNodes = new Set<string>()
            let curr: string | null = endId
            while (curr) {
                pathNodes.add(curr)
                curr = parent[curr]
            }

            yield {
                visual: graphVisual(snapNodes(current, pathNodes), snapEdges(new Set(), pathEdges)),
                variables: makeVars({ v: current, t: endId, pathEdges: [...pathEdges] }),
                highlightedLines: [LINE_OFFSET + 8],
                description: `JA! Doel "${endId}" bereikt, reconstructie van het pad`,
            }

            return
        }

        yield {
            visual: graphVisual(snapNodes(current, new Set()), snapEdges(new Set(), new Set())),
            variables: makeVars({ v: current, t: endId }),
            highlightedLines: [LINE_OFFSET + 7],
            description: `NEE, v="${current}" ≠ t="${endId}", ga verder`,
        }

        // Line 13: verplaats v van open naar closed
        open.delete(current)
        closed.add(current)

        yield {
            visual: graphVisual(snapNodes(current, new Set()), snapEdges(new Set(), new Set())),
            variables: makeVars({ v: current }),
            highlightedLines: [LINE_OFFSET + 9],
            description: `Verplaats "${current}" van open naar closed`,
        }

        // Line 14: for elke buur w van v do
        const neighbours = adj[current] || []

        yield {
            visual: graphVisual(snapNodes(current, new Set()), snapEdges(new Set(), new Set())),
            variables: makeVars({ v: current, buren: neighbours.map(n => n.to) }),
            highlightedLines: [LINE_OFFSET + 10],
            description: `Doorloop alle buren van "${current}": [${neighbours.map(n => n.to).join(', ')}]`,
        }

        for (const { id: edgeId, to: w, weight } of neighbours) {
            yield {
                visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                variables: makeVars({ v: current, w }),
                highlightedLines: [LINE_OFFSET + 11],
                description: `Bekijk buur w="${w}"`,
            }

            // Line 15-16: if w ∈ closed then continue
            const wInClosed = closed.has(w)
            yield {
                visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                variables: makeVars({ v: current, w, 'w ∈ closed': wInClosed }),
                highlightedLines: [LINE_OFFSET + 11],
                description: `Controleer: w="${w}" ∈ closed?`,
            }

            if (wInClosed) {
                yield {
                    visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                    variables: makeVars({ v: current, w }),
                    highlightedLines: [LINE_OFFSET + 12],
                    description: `JA, "${w}" zit al in closed, sla over (continue)`,
                }
                continue
            }

            yield {
                visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                variables: makeVars({ v: current, w }),
                highlightedLines: [LINE_OFFSET + 11],
                description: `NEE, "${w}" niet in closed, ga verder`,
            }

            // Line 17: tentative ← g[v] + gewicht(v, w)
            const tentative = g[current] + weight

            yield {
                visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                variables: makeVars({
                    v: current,
                    w,
                    [`g[${current}]`]: fmt(g[current]),
                    gewicht: weight,
                    tentative,
                }),
                highlightedLines: [LINE_OFFSET + 13],
                description: `Bereken tentative ← g[${current}] + gewicht = ${fmt(g[current])} + ${weight} = ${tentative}`,
            }

            // Line 18: if w ∉ open of tentative < g[w] then
            const wNotInOpen = !open.has(w)
            const betterPath = tentative < g[w]
            const shouldUpdate = wNotInOpen || betterPath

            yield {
                visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                variables: makeVars({
                    v: current,
                    w,
                    'w ∉ open': wNotInOpen,
                    tentative,
                    [`g[${w}]`]: fmt(g[w]),
                    'tentative < g[w]': betterPath,
                }),
                highlightedLines: [LINE_OFFSET + 14],
                description: `Controleer: w="${w}" ∉ open OF ${tentative} < ${fmt(g[w])}?`,
            }

            if (shouldUpdate) {
                yield {
                    visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                    variables: makeVars({ v: current, w }),
                    highlightedLines: [LINE_OFFSET + 14],
                    description: `JA! Update pad naar "${w}" (beter pad gevonden)`,
                }

                // Line 19: ouder[w] ← v
                parent[w] = current
                yield {
                    visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                    variables: makeVars({ v: current, w, [`ouder[${w}]`]: parent[w] }),
                    highlightedLines: [LINE_OFFSET + 15],
                    description: `ouder[${w}] ← ${current} (sla ouder op voor pad reconstructie)`,
                }

                // Line 20: g[w] ← tentative
                g[w] = tentative
                yield {
                    visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                    variables: makeVars({ v: current, w, [`g[${w}]`]: fmt(g[w]) }),
                    highlightedLines: [LINE_OFFSET + 16],
                    description: `g[${w}] ← ${tentative} (nieuwe afstand vanaf start)`,
                }

                // Line 21: f[w] ← g[w] + h(w)
                f[w] = g[w] + (heuristic[w] ?? 0)
                yield {
                    visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                    variables: makeVars({
                        v: current,
                        w,
                        [`g[${w}]`]: fmt(g[w]),
                        [`h(${w})`]: heuristic[w] ?? 0,
                        [`f[${w}]`]: fmt(f[w]),
                    }),
                    highlightedLines: [LINE_OFFSET + 17],
                    description: `f[${w}] ← g[${w}] + h(${w}) = ${fmt(g[w])} + ${heuristic[w] ?? 0} = ${fmt(f[w])}`,
                }

                // Line 22: voeg w toe aan open
                open.add(w)
                yield {
                    visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                    variables: makeVars({ v: current, w }),
                    highlightedLines: [LINE_OFFSET + 18],
                    description: `Voeg "${w}" toe aan open (moet nog onderzocht worden)`,
                }
            } else {
                yield {
                    visual: graphVisual(snapNodes(w, new Set()), snapEdges(new Set([edgeId]), new Set())),
                    variables: makeVars({ v: current, w }),
                    highlightedLines: [LINE_OFFSET + 14],
                    description: `NEE, pad naar "${w}" niet beter, geen update`,
                }
            }
        }
    }

    // Line 23: return geen pad
    yield {
        visual: graphVisual(snapNodes(null, new Set()), snapEdges(new Set(), new Set())),
        variables: makeVars({ result: 'Geen pad gevonden' }),
        highlightedLines: [LINE_OFFSET + 19],
        description: `Open lijst is leeg, geen pad gevonden van "${startId}" naar "${endId}"`,
    }
}

export const aStarDefinition = defineAlgorithm<AStarInput>({
    id: 'astar',
    name: 'A*',
    category: 'search',
    visualType: 'graph',
    defaultInputId: 'classic',
    inputs: [
        {
          id: 'Roemenië',
          name: 'Roemenië',
          input: astarRomaniaInput,
        },
        {
            id: 'classic',
            name: 'Klassieke graaf',
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