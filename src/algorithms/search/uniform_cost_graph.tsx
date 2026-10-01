import { defineAlgorithm } from '@/algorithms/shared/types'
import type {
    AlgorithmFrame,
    GraphNodeState,
    GraphEdgeState,
} from '@/algorithms/shared/types'

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

export interface UniformCostInput {
    nodes: InputNode[]
    edges: InputEdge[]
    startId: string
    goalId: string
}

/**
 * Pseudocode, licht aangepast zodat het expliciet
 * "uniforme kost" graph search uitdrukt:
 */
const pseudocode = `# Invoer Een zoekprobleem 𝑃.
# Uitvoer Een sequentie van acties of error wanneer er geen oplossing werd gevonden.
1: function GRAPHSEARCH(𝑃)
2:   𝑓 ← nieuwe lege prioriteitslijst ∥ De open lijst, geordend op padkost
3:   closed ← ∅ ∥ Verzameling geëxpandeerde toestanden
4:   𝑓.add(nieuw plan gebaseerd op initiële toestand van 𝑃 en kost 0)
5:   while 𝑓 ≠ ∅ do
6:     𝑐 ← 𝑓.chooseAndRemovePlanMetMinimaleKost() ∥ Kies het goedkoopste plan
7:     if 𝑃.goalTest(𝑐.getState) = true then
8:       return getActionSeq(c)
9:     else
10:      if 𝑐.getState ∉ closed then
11:        closed ← closed ∪ 𝑐.getState
12:        for (𝑠, 𝑎, 𝑘) ∈ 𝑐.getState.getSuccessors do ∥ opvolger en stapkost 𝑘
13:          𝑓.add(nieuw plan gebaseerd op (𝑠, 𝑎) en 𝑐 met extra kost 𝑘)
14:        end for
15:      end if
16:    end if
17:   end while
18:   return error: geen oplossing gevonden
19: end function`

// ----- Interne representatie --------------------------------------------------

type Adjacency = Record<string, { id: string; to: string; weight: number }[]>

function buildAdjacency(nodeIds: string[], edges: InputEdge[]): Adjacency {
    const adj: Adjacency = {}
    for (const id of nodeIds) adj[id] = []
    for (const e of edges) {
        // ongerichte graaf
        adj[e.source].push({ id: e.id, to: e.target, weight: e.weight })
        adj[e.target].push({ id: e.id, to: e.source, weight: e.weight })
    }
    return adj
}

interface Plan {
    stateId: string
    path: string[]    // volgorde van knopen
    cost: number      // totale padkost tot deze toestand
}

// Kleine prioriteits-"queue" op basis van kost
function chooseAndRemoveMin(frontier: Plan[]): Plan | undefined {
    if (frontier.length === 0) return undefined
    let bestIndex = 0
    let bestCost = frontier[0].cost
    for (let i = 1; i < frontier.length; i++) {
        if (frontier[i].cost < bestCost) {
            bestCost = frontier[i].cost
            bestIndex = i
        }
    }
    const [plan] = frontier.splice(bestIndex, 1)
    return plan
}

// ----- Visual helpers ---------------------------------------------------------

function makeNodeSnapshot(
    nodes: InputNode[],
    // frontier: Plan[],
    closed: Set<string>,
    current: Plan | null,
    solutionPath: Set<string>,
    g: Record<string, number>,
): GraphNodeState[] {
    // const frontierStates = new Set(frontier.map(p => p.stateId))
    return nodes.map(n => {
        let status: GraphNodeState['status'] = 'unvisited'

        if (solutionPath.has(n.id)) {
            status = 'path'
        } else if (current && n.id === current.stateId) {
            status = 'active'
        } else if (closed.has(n.id)) {
            status = 'visited'
        // } else if (frontierStates.has(n.id)) {
        //     status = 'active'
        }

        return {
            ...n,
            status,
            value: `g=${g[n.id] === Infinity ? '∞' : g[n.id]}`,   // <-- toon altijd g
        }
    })
}


function makeEdgeSnapshot(
    edges: InputEdge[],
    activeEdgeId: string | null,
    solutionEdges: Set<string>,
): GraphEdgeState[] {
    return edges.map(e => ({
        ...e,
        status: solutionEdges.has(e.id)
            ? 'path'
            : activeEdgeId === e.id
                ? 'active'
                : 'default',
    }))
}

// Rekonstrueer pad-randen uit de knoopvolgorde
function pathEdgesFromPath(nodesPath: string[], edges: InputEdge[]): Set<string> {
    const result = new Set<string>()
    for (let i = 0; i + 1 < nodesPath.length; i++) {
        const a = nodesPath[i]
        const b = nodesPath[i + 1]
        const edge = edges.find(
            e =>
                (e.source === a && e.target === b) ||
                (e.source === b && e.target === a),
        )
        if (edge) result.add(edge.id)
    }
    return result
}

// ----- Algoritme-runner (generator) ------------------------------------------

function* run(input: UniformCostInput): Generator<AlgorithmFrame> {
    // "1: function GRAPHSEARCH(P)" is de 3e regel in de string
    const LINE_OFFSET = 3

    const { nodes: inputNodes, edges: inputEdges, startId, goalId } = input
    const nodeIds = inputNodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, inputEdges)

    const frontier: Plan[] = []
    const closed = new Set<string>()

    // Globale g-waarden per knoop (kortste bekende kost tot nu toe)
    const g: Record<string, number> = {}
    for (const id of nodeIds) g[id] = Infinity
    const fmt = (n: number) => (n === Infinity ? '∞' : String(n))

    const noSolutionPath = new Set<string>()
    const noSolutionEdges = new Set<string>()

    const graphVisual = (
        current: Plan | null,
        activeEdgeId: string | null,
        solutionPath: Set<string>,
        solutionEdges: Set<string>,
    ) => ({
        type: 'graph' as const,
        nodes: makeNodeSnapshot(inputNodes, closed, current, solutionPath, g),
        edges: makeEdgeSnapshot(inputEdges, activeEdgeId, solutionEdges),
    })

    // Basis-variabelen voor elk frame.
    // - `includeC`: of we c überhaupt willen tonen (alleen binnen de while-lus)
    // - `current`: de actuele waarde van c, indien van toepassing
    const varsBase = (options: { current?: Plan | null; includeC?: boolean } = {}) => {
        const { current = null, includeC = false } = options

        const base: Record<string, unknown> = {
            f: frontier.map(p => ({
                state: p.stateId,
                cost: p.cost,
                path: p.path,
            })),
            closed: [...closed],
            g: Object.fromEntries(nodeIds.map(id => [id, fmt(g[id])])),
        }

        if (includeC && current) {
            base.c = {
                state: current.stateId,
                cost: current.cost,
                path: current.path,
            }
        }

        return base
    }

    // 2: f ← nieuwe lege prioriteitslijst
    yield {
        visual: graphVisual(null, null, noSolutionPath, noSolutionEdges),
        variables: varsBase(),                        // c wordt hier nog NIET getoond
        highlightedLines: [LINE_OFFSET + 1],
        description: 'Initialiseer 𝑓 als lege prioriteitslijst (open lijst).',
    }

    // 3: closed ← ∅
    yield {
        visual: graphVisual(null, null, noSolutionPath, noSolutionEdges),
        variables: varsBase(),                        // nog steeds geen c
        highlightedLines: [LINE_OFFSET + 2],
        description: 'Initialiseer closed ← ∅ (nog geen toestand geëxpandeerd).',
    }

    // 4: f.add(plan gebaseerd op initiële toestand, kost 0)
    const initialPlan: Plan = {
        stateId: startId,
        path: [startId],
        cost: 0,
    }
    frontier.push(initialPlan)
    g[startId] = 0

    yield {
        visual: graphVisual(null, null, noSolutionPath, noSolutionEdges),
        variables: {
            ...varsBase(),                             // nog steeds geen c; c ontstaat pas in lijn 6
            start: startId,
            goal: goalId,
        },
        highlightedLines: [LINE_OFFSET + 3],
        description: `Voeg initieel plan toe voor startknoop "${startId}" met kost 0.`,
    }

    // 5: while f ≠ ∅ do
    while (frontier.length > 0) {
        yield {
            visual: graphVisual(null, null, noSolutionPath, noSolutionEdges),
            variables: varsBase(),                    // binnen de lus, maar vóór lijn 6: nog geen c gekozen
            highlightedLines: [LINE_OFFSET + 4],
            description: `Controleer while-voorwaarde: 𝑓 ≠ ∅? (|𝑓| = ${frontier.length}).`,
        }

        // 6: c ← f.chooseAndRemovePlanMetMinimaleKost()
        const current = chooseAndRemoveMin(frontier)
        if (!current) break

        if (current.cost < g[current.stateId]) {
            g[current.stateId] = current.cost
        }

        yield {
            visual: graphVisual(current, null, noSolutionPath, noSolutionEdges),
            variables: varsBase({ current, includeC: true }),
            highlightedLines: [LINE_OFFSET + 5],
            description: `Kies plan 𝑐 met minimale kost: toestand "${current.stateId}", kost g=${current.cost}.`,
        }

        // 7: if P.goalTest(c.getState) = true then
        const isGoal = current.stateId === goalId
        yield {
            visual: graphVisual(current, null, noSolutionPath, noSolutionEdges),
            variables: {
                ...varsBase({ current, includeC: true }),
                goal: goalId,
                'P.goalTest(c.getState)': isGoal,
            },
            highlightedLines: [LINE_OFFSET + 6],
            description: `Controleer doeltest: is "${current.stateId}" = "${goalId}"?`,
        }

        if (isGoal) {
            const solPath = new Set(current.path)
            const solEdges = pathEdgesFromPath(current.path, inputEdges)

            yield {
                visual: graphVisual(current, null, solPath, solEdges),
                variables: {
                    ...varsBase({ current, includeC: true }),
                    solution: current.path,
                    cost: current.cost,
                },
                highlightedLines: [LINE_OFFSET + 7],
                description: `Doel bereikt! Uniforme-kost oplossing met kost ${current.cost}: ${current.path.join(
                    ' → ',
                )}`,
            }
            return
        }

        // 9–10: check closed
        const inClosed = closed.has(current.stateId)
        yield {
            visual: graphVisual(current, null, noSolutionPath, noSolutionEdges),
            variables: {
                ...varsBase({ current, includeC: true }),
                state: current.stateId,
                'state ∈ closed': inClosed,
            },
            highlightedLines: [LINE_OFFSET + 9],
            description: `Controleer of "${current.stateId}" al in closed zit.`,
        }

        if (inClosed) {
            yield {
                visual: graphVisual(current, null, noSolutionPath, noSolutionEdges),
                variables: {
                    ...varsBase({ current, includeC: true }),
                    state: current.stateId,
                },
                highlightedLines: [LINE_OFFSET + 9],
                description: `Toestand "${current.stateId}" zat al in closed → sla over.`,
            }
            continue
        }

        // 11: closed ← closed ∪ c.getState
        closed.add(current.stateId)
        yield {
            visual: graphVisual(current, null, noSolutionPath, noSolutionEdges),
            variables: varsBase({ current, includeC: true }),
            highlightedLines: [LINE_OFFSET + 10],
            description: `Voeg "${current.stateId}" toe aan closed (geëxpandeerd).`,
        }

        // 12: for (s, a, k) ∈ c.getState.getSuccessors do
        const successors = adj[current.stateId] || []
        yield {
            visual: graphVisual(current, null, noSolutionPath, noSolutionEdges),
            variables: {
                ...varsBase({ current, includeC: true }),
                state: current.stateId,
                successors: successors.map(su => ({
                    s: su.to,
                    kost: su.weight,
                })),
            },
            highlightedLines: [LINE_OFFSET + 11],
            description: `Doorloop de opvolgers van "${current.stateId}".`,
        }

        for (const { id: edgeId, to: s, weight } of successors) {
            const newCost = current.cost + weight

            const childPlan: Plan = {
                stateId: s,
                path: [...current.path, s],
                cost: newCost,
            }

            if (newCost < g[s]) {
                g[s] = newCost
            }

            frontier.push(childPlan)

            yield {
                visual: graphVisual(
                    current,                       // c blijft het huidige plan; we tonen de expansie
                    edgeId,
                    noSolutionPath,
                    noSolutionEdges,
                ),
                variables: {
                    ...varsBase({ current, includeC: true }),
                    nieuwPlan: {
                        state: childPlan.stateId,
                        cost: childPlan.cost,
                        path: childPlan.path,
                    },
                },
                highlightedLines: [LINE_OFFSET + 12],
                description: `Voeg nieuw plan toe: pad ${childPlan.path.join(
                    ' → ',
                )} met totale kost g=${newCost}.`,
            }
        }
    }

    // 18: return error: geen oplossing gevonden
    yield {
        visual: graphVisual(null, null, noSolutionPath, noSolutionEdges),
        variables: {
            ...varsBase(),                             // buiten de lus: c bestaat niet meer
            result: 'error: geen oplossing gevonden',
        },
        highlightedLines: [LINE_OFFSET + 16],
        description:
            'Open lijst is leeg en doel niet bereikt → error: geen oplossing gevonden.',
    }
}

// ----- Voorbeeldgraaf(fen) voor visualisatie ----------------------------------

const simpleInput: UniformCostInput = {
    nodes: [
        { id: 'A', label: 'A', x: 120, y: 200 },
        { id: 'B', label: 'B', x: 260, y: 120 },
        { id: 'C', label: 'C', x: 260, y: 280 },
        { id: 'D', label: 'D', x: 420, y: 200 },
    ],
    edges: [
        // Goedkoop pad: A → B → D met kost 1 + 2 = 3
        { id: 'A-B', source: 'A', target: 'B', weight: 1 },
        { id: 'B-D', source: 'B', target: 'D', weight: 2 },
        // Duurder alternatief: A → C → D met kost 5 + 1 = 6
        { id: 'A-C', source: 'A', target: 'C', weight: 5 },
        { id: 'C-D', source: 'C', target: 'D', weight: 1 },
    ],
    startId: 'A',
    goalId: 'D',
}

const branchingInput: UniformCostInput = {
    nodes: [
        { id: 'S', label: 'S', x: 120, y: 200 },
        { id: 'X', label: 'X', x: 260, y: 80 },
        { id: 'Y', label: 'Y', x: 260, y: 200 },
        { id: 'Z', label: 'Z', x: 260, y: 320 },
        { id: 'G', label: 'G', x: 420, y: 200 },
    ],
    edges: [
        { id: 'S-X', source: 'S', target: 'X', weight: 2 },
        { id: 'S-Y', source: 'S', target: 'Y', weight: 1 },
        { id: 'S-Z', source: 'S', target: 'Z', weight: 4 },
        { id: 'X-G', source: 'X', target: 'G', weight: 4 },
        { id: 'Y-G', source: 'Y', target: 'G', weight: 5 },
        { id: 'Z-G', source: 'Z', target: 'G', weight: 1 },
    ],
    startId: 'S',
    goalId: 'G',
}

// ----- Definitie voor de visualizer -------------------------------------------

export const uniformCostGraphDefinition = defineAlgorithm<UniformCostInput>({
    id: 'uniform-cost-graph-search',
    name: 'Uniforme Kost',
    category: 'search',
    visualType: 'graph',
    defaultInputId: 'simple',
    inputs: [
        {
            id: 'simple',
            name: 'Eenvoudige graaf',
            input: simpleInput,
        },
        {
            id: 'branching',
            name: 'Vertakkende graaf',
            input: branchingInput,
        },
    ],
    pythonCode: pseudocode,
    run,
})