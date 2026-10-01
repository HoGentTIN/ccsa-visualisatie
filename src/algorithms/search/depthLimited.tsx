import { defineAlgorithm } from '@/algorithms/shared/types'
import type {
    AlgorithmFrame,
    GraphNodeState,
    GraphEdgeState,
    CallStackFrame,
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
}

export interface DepthLimitedInput {
    nodes: InputNode[]
    edges: InputEdge[]
    startId: string
    goalId: string
    maxDepth: number
}

const pseudocode = `# Invoer Een zoekprobleem 𝑃, een maximale diepte 𝑑.
# Uitvoer Een sequentie van acties wanneer een oplossing werd gevonden met diepte 𝑑 of minder; een “hit boundary” conditie wanneer tijdens het zoekproces de maximale diepte werd bereikt of “error” wanneer er geen oplossing werd gevonden.
function DEPTHLIMITEDSEARCH(𝑃, 𝑑)
    𝑐 ← nieuw plan gebaseerd op initiële toestand 𝑃
    return DlsRecursive(𝑐, 𝑃, 𝑑)
end function

# Invoer Een huidig plan 𝑐, een zoekprobleem 𝑃 en een maximale diepte 𝑑.
# Uitvoer Een sequentie van acties wanneer een oplossing werd gevonden met diepte 𝑑 of minder startend vanaf het huidig plan; een “hit boundary” conditie wanneer tijdens het zoekproces de maximale diepte werd bereikt of “error” wanneer er geen oplossing werd gevonden.
function DLSRECURSIVE(𝑐, 𝑃, 𝑑)
    if 𝑃.goalTest(𝑐.getState) = true then
        return getActionSeq(c) ∥ Oplossing gevonden
    end if
    if 𝑑 = 0 then
        return “hit boundary” ∥ Grens bereikt
    end if
    boundaryHit ← false ∥ Grens bereikt in één van de rec. oproepen?
    for (𝑠, 𝑎) ∈ 𝑐.getState.getSuccessors do
        child ← nieuw plan gebaseerd op (𝑠, 𝑎) en 𝑐
        sol ← DlsRecursive(child, 𝑃, 𝑑 − 1) ∥ Recursieve oproep
        if sol = “hit boundary” then
            boundaryHit ← true
        else
            if sol ≠ “error: geen oplossing gevonden” then
                return sol ∥ Effectieve oplossing gevonden
            end if
        end if
    end for
    if boundaryHit = true then
        return “hit boundary”
    else
        return “error: geen oplossing gevonden”
    end if
end function`

type Adjacency = Record<string, string[]>

function buildAdjacency(nodeIds: string[], edges: InputEdge[]): Adjacency {
    const adj: Adjacency = {}
    for (const id of nodeIds) adj[id] = []
    for (const e of edges) {
        adj[e.source].push(e.target)
        adj[e.target].push(e.source) // ongerichte graaf
    }
    return adj
}

type DlsResult =
    | { kind: 'solution'; path: string[] }
    | { kind: 'hit-boundary' }
    | { kind: 'failure' }

interface Plan {
    stateId: string
    path: string[] // volgorde van knopen vanaf start tot hier
}

function createInitialPlan(startId: string): Plan {
    return { stateId: startId, path: [startId] }
}

function* run(input: DepthLimitedInput): Generator<AlgorithmFrame> {
    // DEPTHLIMITEDSEARCH starts at line 1 in the pseudocode block above
    const TOP_OFFSET = 1

    // DLSRECURSIVE starts further down; count the lines in the string.
    // In the given pseudocode, "function DLSRECURSIVE(𝑐, 𝑃, 𝑑)" is line 9.
    const DLS_OFFSET = 9

    const { nodes: inputNodes, edges: inputEdges, startId, goalId, maxDepth } = input
    const nodeIds = inputNodes.map(n => n.id)
    const adj = buildAdjacency(nodeIds, inputEdges)

    const frames: AlgorithmFrame[] = []
    const callStack: CallStackFrame[] = []

    const getCallStack = () => [...callStack]

    const pushFrame = (frame: AlgorithmFrame) => {
        frames.push(frame)
    }

    // Visuele helpers ----------------------------------------------------------

    const snapshotNodes = (currentPlan: Plan | null, solutionPath: Set<string>): GraphNodeState[] => {
        const pathSet = new Set(currentPlan?.path ?? [])
        return inputNodes.map(n => ({
            ...n,
            status: solutionPath.has(n.id)
                ? 'path'
                : pathSet.has(n.id)
                    ? 'active'
                    : 'unvisited',
        }))
    }

    const snapshotEdges = (solutionPath: Set<string>): GraphEdgeState[] =>
        inputEdges.map(e => ({
            ...e,
            status:
                solutionPath.has(e.source) && solutionPath.has(e.target)
                    ? 'path'
                    : 'default',
        }))

    // Probleem P abstraheren: enkel goalTest en getSuccessors
    const goalTest = (stateId: string) => stateId === goalId
    const getSuccessors = (stateId: string): { s: string; a: string }[] =>
        adj[stateId].map(s => ({ s, a: `ga naar ${s}` }))

    function dlsRecursive(plan: Plan, depth: number): DlsResult {
        // Call stack push
        callStack.push({
            id: `DLS-${plan.stateId}-${depth}-${callStack.length}`,
            name: 'DLSRECURSIVE',
            args: { state: plan.stateId, d: depth, path: [...plan.path] },
        })

        // Aanroep-frame (inside DLSRECURSIVE body)
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(plan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                state: plan.stateId,
                path: plan.path,
                d: depth,
            },
            highlightedLines: [DLS_OFFSET + 1], // first line in body: if goalTest...
            description: `Aanroep DLSRECURSIVE op toestand "${plan.stateId}" met d=${depth}`,
            callStack: getCallStack(),
        })

        // if P.goalTest(c.getState) = true then ...
        const isGoal = goalTest(plan.stateId)
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(plan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                state: plan.stateId,
                path: plan.path,
                d: depth,
                'P.goalTest(c.getState)': isGoal,
            },
            highlightedLines: [DLS_OFFSET + 1],
            description: `Controleer doeltoestand: P.goalTest(${plan.stateId}) = ${isGoal}`,
            callStack: getCallStack(),
        })

        if (isGoal) {
            const solPath = new Set(plan.path)
            pushFrame({
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes(plan, solPath),
                    edges: snapshotEdges(solPath),
                },
                variables: {
                    state: plan.stateId,
                    solution: plan.path,
                },
                highlightedLines: [DLS_OFFSET + 2], // return getActionSeq(c)
                description: `Doel bereikt! getActionSeq(c) = ${plan.path.join(' → ')}`,
                callStack: getCallStack(),
            })
            callStack.pop()
            return { kind: 'solution', path: plan.path }
        }

        // if d = 0 then ...
        const atBoundary = depth === 0
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(plan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                state: plan.stateId,
                d: depth,
                'd = 0': atBoundary,
            },
            highlightedLines: [DLS_OFFSET + 4], // if 𝑑 = 0 then
            description: `Controleer diepte: d = ${depth} → ${atBoundary ? 'grens bereikt' : 'nog ruimte'}`,
            callStack: getCallStack(),
        })

        if (atBoundary) {
            pushFrame({
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes(plan, new Set()),
                    edges: snapshotEdges(new Set()),
                },
                variables: {
                    state: plan.stateId,
                    d: depth,
                    result: 'hit boundary',
                },
                highlightedLines: [DLS_OFFSET + 5], // return "hit boundary"
                description: `Diepte-grens bereikt bij toestand "${plan.stateId}" → "hit boundary"`,
                callStack: getCallStack(),
            })
            callStack.pop()
            return { kind: 'hit-boundary' }
        }

        // boundaryHit ← false
        let boundaryHit = false
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(plan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                state: plan.stateId,
                d: depth,
                boundaryHit,
            },
            highlightedLines: [DLS_OFFSET + 6],
            description: `Initialiseer boundaryHit ← false`,
            callStack: getCallStack(),
        })

        // for (s, a) ∈ c.getState.getSuccessors do
        const successors = getSuccessors(plan.stateId)
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(plan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                state: plan.stateId,
                d: depth,
                successors: successors.map(su => su.s),
            },
            highlightedLines: [DLS_OFFSET + 7],
            description: `Doorloop alle opvolgers van "${plan.stateId}": [${successors
                .map(su => su.s)
                .join(', ')}]`,
            callStack: getCallStack(),
        })

        for (const { s, a } of successors) {
            const childPlan: Plan = {
                stateId: s,
                path: [...plan.path, s],
            }

            // child ← nieuw plan ...
            pushFrame({
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes(childPlan, new Set()),
                    edges: snapshotEdges(new Set()),
                },
                variables: {
                    parentState: plan.stateId,
                    action: a,
                    childState: childPlan.stateId,
                    childPath: childPlan.path,
                    d: depth,
                },
                highlightedLines: [DLS_OFFSET + 8],
                description: `Maak child-plan: (${plan.stateId}) --${a}→ (${s}), pad: ${childPlan.path.join(
                    ' → ',
                )}`,
                callStack: getCallStack(),
            })

            // sol ← DlsRecursive(child, P, d − 1)
            pushFrame({
                visual: {
                    type: 'graph',
                    nodes: snapshotNodes(childPlan, new Set()),
                    edges: snapshotEdges(new Set()),
                },
                variables: {
                    state: childPlan.stateId,
                    dChild: depth - 1,
                },
                highlightedLines: [DLS_OFFSET + 9],
                description: `Recursieve oproep: DLSRECURSIVE(child, P, d − 1) met d − 1 = ${
                    depth - 1
                }`,
                callStack: getCallStack(),
            })

            const sol = dlsRecursive(childPlan, depth - 1)

            if (sol.kind === 'hit-boundary') {
                boundaryHit = true
                pushFrame({
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes(plan, new Set()),
                        edges: snapshotEdges(new Set()),
                    },
                    variables: {
                        state: plan.stateId,
                        d: depth,
                        boundaryHit,
                        childState: childPlan.stateId,
                        sol: 'hit boundary',
                    },
                    highlightedLines: [DLS_OFFSET + 10],
                    description: `Resultaat van child "${childPlan.stateId}" is "hit boundary" → boundaryHit ← true`,
                    callStack: getCallStack(),
                })
            } else if (sol.kind === 'solution') {
                const solPathSet = new Set(sol.path)
                pushFrame({
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes(plan, solPathSet),
                        edges: snapshotEdges(solPathSet),
                    },
                    variables: {
                        state: plan.stateId,
                        d: depth,
                        solution: sol.path,
                    },
                    highlightedLines: [DLS_OFFSET + 12],
                    description: `Effectieve oplossing gevonden via child "${childPlan.stateId}" → return oplossing`,
                    callStack: getCallStack(),
                })
                callStack.pop()
                return sol
            } else {
                pushFrame({
                    visual: {
                        type: 'graph',
                        nodes: snapshotNodes(plan, new Set()),
                        edges: snapshotEdges(new Set()),
                    },
                    variables: {
                        state: plan.stateId,
                        d: depth,
                        childState: childPlan.stateId,
                        sol: 'error: geen oplossing gevonden',
                    },
                    highlightedLines: [DLS_OFFSET + 11],
                    description: `Child "${childPlan.stateId}" gaf "error: geen oplossing gevonden" → verder zoeken`,
                    callStack: getCallStack(),
                })
            }
        }

        // if boundaryHit = true then ... else ...
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(plan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                state: plan.stateId,
                d: depth,
                boundaryHit,
            },
            highlightedLines: [DLS_OFFSET + 13, DLS_OFFSET + 15],
            description: boundaryHit
                ? `Minstens één recursieve oproep heeft de diepte-grens geraakt → return "hit boundary"`
                : `Geen grenzen geraakt en geen oplossing gevonden → return "error: geen oplossing gevonden"`,
            callStack: getCallStack(),
        })

        callStack.pop()

        if (boundaryHit) {
            return { kind: 'hit-boundary' }
        }
        return { kind: 'failure' }
    }

    // DEPTHLIMITEDSEARCH( P, d ) -----------------------------------------------

    const initialPlan = createInitialPlan(startId)

    // Lines 1–4 in the pseudocode belong to DEPTHLIMITEDSEARCH
    pushFrame({
        visual: {
            type: 'graph',
            nodes: snapshotNodes(initialPlan, new Set()),
            edges: snapshotEdges(new Set()),
        },
        variables: {
            P: 'graaf met start- en doelknoop',
            d: maxDepth,
            start: startId,
            goal: goalId,
        },
        highlightedLines: [TOP_OFFSET + 0, TOP_OFFSET + 1], // comment + function header
        description: `Start DEPTHLIMITEDSEARCH met max diepte d = ${maxDepth}`,
        callStack: getCallStack(),
    })

    pushFrame({
        visual: {
            type: 'graph',
            nodes: snapshotNodes(initialPlan, new Set()),
            edges: snapshotEdges(new Set()),
        },
        variables: {
            c: { state: initialPlan.stateId, path: initialPlan.path },
        },
        highlightedLines: [TOP_OFFSET + 2], // c ← ...
        description: `c ← nieuw plan gebaseerd op initiële toestand "${startId}"`,
        callStack: getCallStack(),
    })

    pushFrame({
        visual: {
            type: 'graph',
            nodes: snapshotNodes(initialPlan, new Set()),
            edges: snapshotEdges(new Set()),
        },
        variables: {
            c: { state: initialPlan.stateId, path: initialPlan.path },
            d: maxDepth,
        },
        highlightedLines: [TOP_OFFSET + 3], // return DlsRecursive(c, P, d)
        description: `Roep DLSRECURSIVE(c, P, d) aan`,
        callStack: getCallStack(),
    })

    const result = dlsRecursive(initialPlan, maxDepth)


    if (result.kind === 'solution') {
        const pathSet = new Set(result.path)
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(initialPlan, pathSet),
                edges: snapshotEdges(pathSet),
            },
            variables: {
                result: 'solution',
                solution: result.path,
            },
            highlightedLines: [TOP_OFFSET + 4],
            description: `DEPTHLIMITEDSEARCH eindigt met oplossing: ${result.path.join(' → ')}`,
            callStack: getCallStack(),
        })
    } else if (result.kind === 'hit-boundary') {
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(initialPlan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                result: 'hit boundary',
            },
            highlightedLines: [TOP_OFFSET + 4],
            description:
                'DEPTHLIMITEDSEARCH eindigt met "hit boundary" — mogelijk oplossing bij grotere diepte',
            callStack: getCallStack(),
        })
    } else {
        pushFrame({
            visual: {
                type: 'graph',
                nodes: snapshotNodes(initialPlan, new Set()),
                edges: snapshotEdges(new Set()),
            },
            variables: {
                result: 'error: geen oplossing gevonden',
            },
            highlightedLines: [TOP_OFFSET + 4],
            description:
                'DEPTHLIMITEDSEARCH eindigt met "error: geen oplossing gevonden" voor deze diepte',
            callStack: getCallStack(),
        })
    }


    // Generator over alle verzamelde frames
    for (const frame of frames) {
        yield frame
    }
}

// Kleine voorbeeldgraaf --------------------------------------------------------

const exampleInput: DepthLimitedInput = {
    nodes: [
        { id: 'A', label: 'A', x: 100, y: 200 },
        { id: 'B', label: 'B', x: 220, y: 120 },
        { id: 'C', label: 'C', x: 220, y: 280 },
        { id: 'D', label: 'D', x: 360, y:  80 },
        { id: 'E', label: 'E', x: 360, y: 180 },
        { id: 'F', label: 'F', x: 360, y: 280 },
    ],
    edges: [
        { id: 'A-B', source: 'A', target: 'B' },
        { id: 'A-C', source: 'A', target: 'C' },
        { id: 'B-D', source: 'B', target: 'D' },
        { id: 'B-E', source: 'B', target: 'E' },
        { id: 'C-F', source: 'C', target: 'F' },
    ],
    startId: 'A',
    goalId: 'E',
    maxDepth: 2,
}

const deeperInput: DepthLimitedInput = {
    ...exampleInput,
    maxDepth: 1, // zelfde graaf, maar te kleine diepte → "hit boundary"
}

export const depthLimitedDefinition = defineAlgorithm<DepthLimitedInput>({
    id: 'depth-limited-search',
    name: 'Diepte Gelimiteerd Zoeken',
    category: 'search',
    visualType: 'graph',
    defaultInputId: 'depth-2',
    showCallStack: true,
    inputs: [
        {
            id: 'depth-2',
            name: 'Diepte = 2 (oplossing bereikbaar)',
            input: exampleInput,
        },
        {
            id: 'depth-1',
            name: 'Diepte = 1 (hit boundary)',
            input: deeperInput,
        },
    ],
    pythonCode: pseudocode,
    run,
})