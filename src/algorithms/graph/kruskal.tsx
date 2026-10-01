import { defineAlgorithm } from '@/algorithms/shared/types'
import type { AlgorithmFrame, GraphNodeState, GraphEdgeState } from '@/algorithms/shared/types'
import classicInput from './inputs/prim-classic.json'
import smallInput from './inputs/prim-small.json'

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

export interface KruskalInput {
    nodes: InputNode[]
    edges: InputEdge[]
}

const pythonCode = `# Invoer Een ongerichte gewogen graaf 𝐺 = (𝑉, 𝐸) met orde 𝑛 > 0. De knopen zijn genummerd van 1 tot 𝑛, i.e. 𝑉 = {1, 2, … , 𝑛}.
# Uitvoer Een verzameling 𝑇 van bogen die een minimale kost opspannende boom is.
function KRuSKAL(𝐺)
    𝑇 ← ∅ # start met lege boom
    𝐸′ ← sorteer 𝐸 volgens stijgend gewicht
    for all 𝑒′ ∈ 𝐸′ do
        if 𝑇 ∪ 𝑒′ heeft geen cykel then
            𝑇 ← 𝑇 ∪ 𝑒′
        end if
    end for
    return 𝑇
end function`

// Union-Find structuur voor cykeldetectie
class UnionFind {
    private parent: Record<string, string> = {}
    private rank: Record<string, number> = {}

    constructor(elements: string[]) {
        for (const e of elements) {
            this.parent[e] = e
            this.rank[e] = 0
        }
    }

    find(x: string): string {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x])
        }
        return this.parent[x]
    }

    union(a: string, b: string): boolean {
        const rootA = this.find(a)
        const rootB = this.find(b)
        if (rootA === rootB) return false

        if (this.rank[rootA] < this.rank[rootB]) {
            this.parent[rootA] = rootB
        } else if (this.rank[rootA] > this.rank[rootB]) {
            this.parent[rootB] = rootA
        } else {
            this.parent[rootB] = rootA
            this.rank[rootA]++
        }
        return true
    }

    sameSet(a: string, b: string): boolean {
        return this.find(a) === this.find(b)
    }
}

function* run(input: KruskalInput): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3 // "function KRuSKAL(𝐺)" is de derde logische regel

    const { nodes, edges } = input
    const nodeIds = nodes.map(n => n.id)

    // Sorteer randen volgens stijgend gewicht
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight)

    const uf = new UnionFind(nodeIds)
    const mstEdges = new Set<string>()

    const snapshotNodes = (activeNodes: string[] = []): GraphNodeState[] =>
        nodes.map(n => ({
            ...n,
            status: mstEdges.has(
                edges.find(e => mstEdges.has(e.id) && (e.source === n.id || e.target === n.id))?.id ?? '',
            )
                ? 'path'
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

    // ── Initialisatie ─────────────────────────────────────────────────────────────

    // T ← ∅
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            T: [],
            E_sorted: sortedEdges.map(e => e.id),
        },
        highlightedLines: [LINE_OFFSET + 1],
        description: 'Initialiseer 𝑇 ← ∅ (nog geen bogen in de boom).',
    }

    // E′ ← sorteer E volgens stijgend gewicht
    yield {
        visual: { type: 'graph', nodes: snapshotNodes(), edges: snapshotEdges() },
        variables: {
            T: [],
            E_sorted: sortedEdges.map(e => `${e.id}:${e.weight}`),
        },
        highlightedLines: [LINE_OFFSET + 2],
        description: 'Sorteer alle bogen volgens stijgend gewicht → 𝐸′.',
    }

    // ── Hoofdlus over alle bogen in 𝐸′ ───────────────────────────────────────────

    for (const e of sortedEdges) {
        const activeEdges = new Set<string>([e.id])

        // for all e′ ∈ E′ do
        yield {
            visual: {
                type: 'graph',
                nodes: snapshotNodes([e.source, e.target]),
                edges: snapshotEdges(activeEdges),
            },
            variables: {
                huidigeBoog: e.id,
                u: e.source,
                v: e.target,
                gewicht: e.weight,
                T: [...mstEdges],
                E_sorted: sortedEdges.map(se => `${se.id}:${se.weight}`),
            },
            highlightedLines: [LINE_OFFSET + 3],
            description: `Beschouw boog ${e.id} = (${e.source}, ${e.target}) met gewicht ${e.weight}.`,
        }

        const zouCykelVormen = uf.sameSet(e.source, e.target)

        // if T ∪ e′ heeft geen cykel then …
        yield {
            visual: {
                type: 'graph',
                nodes: snapshotNodes([e.source, e.target]),
                edges: snapshotEdges(activeEdges),
            },
            variables: {
                huidigeBoog: e.id,
                u: e.source,
                v: e.target,
                gewicht: e.weight,
                vormtCykel: zouCykelVormen,
                T: [...mstEdges],
            },
            highlightedLines: [LINE_OFFSET + 4],
            description: zouCykelVormen
                ? `Controleer: T ∪ {${e.id}} zou een cykel vormen → JA.`
                : `Controleer: T ∪ {${e.id}} zou een cykel vormen → NEE, veilig om toe te voegen.`,
        }

        if (!zouCykelVormen) {
            uf.union(e.source, e.target)
            mstEdges.add(e.id)

            // T ← T ∪ e′
            yield {
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes([e.source, e.target]),
                    edges: snapshotEdges(activeEdges),
                },
                variables: {
                    huidigeBoog: e.id,
                    u: e.source,
                    v: e.target,
                    gewicht: e.weight,
                    T: [...mstEdges],
                },
                highlightedLines: [LINE_OFFSET + 5],
                description: `Voeg boog ${e.id} toe aan 𝑇 (verbindt twee verschillende componenten).`,
            }
        } else {
            // Boog overslaan omdat ze een cykel zou vormen
            yield {
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes([e.source, e.target]),
                    edges: snapshotEdges(activeEdges),
                },
                variables: {
                    huidigeBoog: e.id,
                    u: e.source,
                    v: e.target,
                    gewicht: e.weight,
                    T: [...mstEdges],
                },
                highlightedLines: [LINE_OFFSET + 4],
                description: `Sla boog ${e.id} over: ze zou een cykel vormen met de huidige 𝑇.`,
            }
        }

        // Optioneel: vroegtijdig stoppen als we genoeg bogen hebben (|V| - 1)
        if (mstEdges.size === Math.max(nodeIds.length - 1, 0)) {
            yield {
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes(),
                    edges: snapshotEdges(),
                },
                variables: {
                    T: [...mstEdges],
                },
                highlightedLines: [LINE_OFFSET + 7],
                description: 'Genoeg bogen in 𝑇 (|𝑉| − 1); resterende bogen worden niet meer bekeken.',
            }
            break
        }
    }

    // return 𝑇
    yield {
        visual: {
            type: 'graph',
            nodes: snapshotNodes(),
            edges: snapshotEdges(),
        },
        variables: {
            T: [...mstEdges],
        },
        highlightedLines: [LINE_OFFSET + 7, LINE_OFFSET + 8],
        description: 'Klaar! 𝑇 is een minimale kost opspannende boom (MST) van de graaf.',
    }
}

export const kruskalDefinition = defineAlgorithm<KruskalInput>({
    id: 'kruskal',
    name: 'Kruskal',
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