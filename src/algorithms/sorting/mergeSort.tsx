import type {
    AlgorithmFrame,
    ArrayElement,
    AnyAlgorithmDefinition,
    CallStackFrame,
} from '@/algorithms/shared/types'
import { defineAlgorithm } from '@/algorithms/shared/types'

type Input = { values: number[] }

const pseudoCode = `function MergeSortRecursive(𝑎, begin, einde)
    if begin < einde then
        midden ← ⌊(begin + einde)/2)⌋
        MergeSortRecursive(𝑎, begin, midden)
        MergeSortRecursive(𝑎, midden + 1, einde)
        Merge(𝑎, begin, midden, einde)
end function

function Merge(𝑎, begin, midden, einde)
    i ← begin # de teller 𝑖 doorloopt de linkse deelrij
    j ← midden + 1 # de teller 𝑗 doorloopt de rechtse deelrij
    hulp_rij ← nieuwe array[𝑛] # tijdelijke hulpopslag
    k ← i # de teller 𝑘 doorloopt hulp_rij
    while 𝑖 ≤ midden and 𝑗 ≤ einde do # totdat een deelrij leeg is
        if 𝑎[𝑖] ≤ 𝑎[𝑗] then # het kleinste element komt eerst
            hulp_rij[𝑘] ← 𝑎[𝑖] ; 𝑖 ← 𝑖 + 1
        else
            hulp_rij[𝑘] ← 𝑎[𝑗] ; 𝑗 ← 𝑗 + 1
        𝑘 ← 𝑘 + 1 # er is een element in hulp_rij opgeslagen
    if 𝑖 > midden then # de 2de deelrij moet leeggemaakt worden
        while 𝑗 ≤ einde do
            hulp_rij[𝑘] ← 𝑎[𝑗] ; 𝑗 ← 𝑗 + 1 ; 𝑘 ← 𝑘 + 1
    else # de 1ste deelrij moet leeggemaakt worden
        while 𝑖 ≤ midden do
            hulp_rij[𝑘] ← 𝑎[𝑖] ; 𝑖 ← 𝑖 + 1 ; 𝑘 ← 𝑘 + 1
    for 𝑘 = begin … einde do # kopieer gesorteerde deelrij naar 𝑎.
        𝑎[𝑘] ← hulp_rij[𝑘]
end function
`

function* run(input: Input): Generator<AlgorithmFrame> {
    const arr = [...input.values]
    const callStack: CallStackFrame[] = []

    const getCallStack = () => [...callStack]

    const snapshot = (
        activeIndices: number[] = [],
        sortedRange: [number, number] | null = null,
    ): ArrayElement[] =>
        arr.map((value, idx) => ({
            id: String(idx),
            value,
            status:
                sortedRange && idx >= sortedRange[0] && idx <= sortedRange[1]
                    ? 'sorted'
                    : activeIndices.includes(idx)
                        ? 'comparing'
                        : 'default',
        }))

    function* merge(begin: number, midden: number, einde: number): Generator<AlgorithmFrame> {
        const LINE_OFFSET = 9
        let i = begin
        let j = midden + 1
        const hulp_rij = [...Array(arr.length)]
        let k = i

        // Initialisatie: i, j, hulp_rij, k
        yield {
            visual: { type: 'array', elements: snapshot([begin, midden, einde]) },
            variables: { begin, midden, einde },
            highlightedLines: [LINE_OFFSET],
            description: `Start Merge: bereik [${begin}..${einde}], splits bij ${midden}`,
            callStack: getCallStack(),
        }

        yield {
            visual: { type: 'array', elements: snapshot([i]) },
            variables: { begin, midden, einde, i },
            highlightedLines: [LINE_OFFSET + 1],
            description: `Teller i ← ${i} (start van linkerhelft)`,
            callStack: getCallStack(),
        }

        yield {
            visual: { type: 'array', elements: snapshot([j]) },
            variables: { begin, midden, einde, i, j },
            highlightedLines: [LINE_OFFSET + 2],
            description: `Teller j ← ${j} (start van rechterhelft)`,
            callStack: getCallStack(),
        }

        yield {
            visual: { type: 'array', elements: snapshot([]) },
            variables: { begin, midden, einde, i, j, hulp_rij: [...hulp_rij] },
            highlightedLines: [LINE_OFFSET + 3],
            description: `Maak hulp_rij aan (tijdelijke opslag voor gesorteerde elementen)`,
            callStack: getCallStack(),
        }

        yield {
            visual: { type: 'array', elements: snapshot([k]) },
            variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
            highlightedLines: [LINE_OFFSET + 4],
            description: `Teller k ← ${k} (positie in hulp_rij)`,
            callStack: getCallStack(),
        }

        // Hoofdlus: vergelijk en voeg samen
        while (i <= midden && j <= einde) {
            yield {
                visual: { type: 'array', elements: snapshot([i, j]) },
                variables: { begin, midden, einde, i, j, k, 'a[i]': arr[i], 'a[j]': arr[j], hulp_rij: [...hulp_rij] },
                highlightedLines: [LINE_OFFSET + 5],
                description: `Controleer lus: i=${i} ≤ midden=${midden}? EN j=${j} ≤ einde=${einde}?`,
                callStack: getCallStack(),
            }

            yield {
                visual: { type: 'array', elements: snapshot([i, j]) },
                variables: { begin, midden, einde, i, j, k, 'a[i]': arr[i], 'a[j]': arr[j], hulp_rij: [...hulp_rij] },
                highlightedLines: [LINE_OFFSET + 6],
                description: `Vergelijk a[${i}]=${arr[i]} met a[${j}]=${arr[j]}`,
                callStack: getCallStack(),
            }

            if (arr[i] <= arr[j]) {
                yield {
                    visual: { type: 'array', elements: snapshot([i, j, k]) },
                    variables: { begin, midden, einde, i, j, k, 'a[i]': arr[i], 'a[j]': arr[j], hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 7],
                    description: `a[${i}]=${arr[i]} ≤ a[${j}]=${arr[j]} → kies linkerelement`,
                    callStack: getCallStack(),
                }

                hulp_rij[k] = arr[i]
                yield {
                    visual: { type: 'array', elements: snapshot([i, k]) },
                    variables: { begin, midden, einde, i, j, k, 'a[i]': arr[i], hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 7],
                    description: `hulp_rij[${k}] ← a[${i}] (=${arr[i]})`,
                    callStack: getCallStack(),
                }

                i = i + 1
                yield {
                    visual: { type: 'array', elements: snapshot([i]) },
                    variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 7],
                    description: `i ← ${i} (volgende in linkerhelft)`,
                    callStack: getCallStack(),
                }
            } else {
                yield {
                    visual: { type: 'array', elements: snapshot([i, j, k]) },
                    variables: { begin, midden, einde, i, j, k, 'a[i]': arr[i], 'a[j]': arr[j], hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 8, LINE_OFFSET + 9],
                    description: `a[${i}]=${arr[i]} > a[${j}]=${arr[j]} → kies rechterelement`,
                    callStack: getCallStack(),
                }

                hulp_rij[k] = arr[j]
                yield {
                    visual: { type: 'array', elements: snapshot([j, k]) },
                    variables: { begin, midden, einde, i, j, k, 'a[j]': arr[j], hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 9],
                    description: `hulp_rij[${k}] ← a[${j}] (=${arr[j]})`,
                    callStack: getCallStack(),
                }

                j = j + 1
                yield {
                    visual: { type: 'array', elements: snapshot([j]) },
                    variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 9],
                    description: `j ← ${j} (volgende in rechterhelft)`,
                    callStack: getCallStack(),
                }
            }

            k = k + 1
            yield {
                visual: { type: 'array', elements: snapshot([k]) },
                variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                highlightedLines: [LINE_OFFSET + 10],
                description: `k ← ${k} (element opgeslagen, ga verder)`,
                callStack: getCallStack(),
            }
        }

        // Restant kopiëren
        yield {
            visual: { type: 'array', elements: snapshot([i, j]) },
            variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
            highlightedLines: [LINE_OFFSET + 11],
            description: `Lus stopt: i=${i} > midden=${midden}? OF j=${j} > einde=${einde}?`,
            callStack: getCallStack(),
        }

        if (i > midden) {
            yield {
                visual: { type: 'array', elements: snapshot([j]) },
                variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                highlightedLines: [LINE_OFFSET + 11],
                description: `i > midden → linkerhelft leeg, kopieer rest van rechterhelft`,
                callStack: getCallStack(),
            }

            while (j <= einde) {
                yield {
                    visual: { type: 'array', elements: snapshot([j]) },
                    variables: { begin, midden, einde, i, j, k, 'a[j]': arr[j], hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 12],
                    description: `j=${j} ≤ einde=${einde}, kopieer a[${j}]=${arr[j]}`,
                    callStack: getCallStack(),
                }

                hulp_rij[k] = arr[j]
                yield {
                    visual: { type: 'array', elements: snapshot([j, k]) },
                    variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 13],
                    description: `hulp_rij[${k}] ← a[${j}] (=${arr[j]})`,
                    callStack: getCallStack(),
                }

                j = j + 1
                k = k + 1
                yield {
                    visual: { type: 'array', elements: snapshot([j, k]) },
                    variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 13],
                    description: `j ← ${j}, k ← ${k}`,
                    callStack: getCallStack(),
                }
            }
        } else {
            yield {
                visual: { type: 'array', elements: snapshot([i]) },
                variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                highlightedLines: [LINE_OFFSET + 14],
                description: `j > einde → rechterhelft leeg, kopieer rest van linkerhelft`,
                callStack: getCallStack(),
            }

            while (i <= midden) {
                yield {
                    visual: { type: 'array', elements: snapshot([i, k]) },
                    variables: { begin, midden, einde, i, j, k, 'a[i]': arr[i], hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 15],
                    description: `i=${i} ≤ midden=${midden}, kopieer a[${i}]=${arr[i]}`,
                    callStack: getCallStack(),
                }

                hulp_rij[k] = arr[i]
                yield {
                    visual: { type: 'array', elements: snapshot([i, k]) },
                    variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 16],
                    description: `hulp_rij[${k}] ← a[${i}] (=${arr[i]})`,
                    callStack: getCallStack(),
                }

                i = i + 1
                k = k + 1
                yield {
                    visual: { type: 'array', elements: snapshot([i, k]) },
                    variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
                    highlightedLines: [LINE_OFFSET + 16],
                    description: `i ← ${i}, k ← ${k}`,
                    callStack: getCallStack(),
                }
            }
        }

        // Kopieer hulp_rij terug naar arr
        yield {
            visual: { type: 'array', elements: snapshot([]) },
            variables: { begin, midden, einde, i, j, k, hulp_rij: [...hulp_rij] },
            highlightedLines: [LINE_OFFSET + 17],
            description: `Nu hulp_rij terug kopiëren naar a[${begin}..${einde}]`,
            callStack: getCallStack(),
        }

        for (k = begin; k <= einde; k++) {
            yield {
                visual: { type: 'array', elements: snapshot([k]) },
                variables: { begin, midden, einde, k, 'hulp_rij[k]': hulp_rij[k], hulp_rij: [...hulp_rij] },
                highlightedLines: [LINE_OFFSET + 17],
                description: `k = ${k}, ga hulp_rij[${k}] kopiëren`,
                callStack: getCallStack(),
            }

            arr[k] = hulp_rij[k]
            yield {
                visual: { type: 'array', elements: snapshot([k], [begin, einde]) },
                variables: { begin, midden, einde, k, 'a[k]': arr[k], hulp_rij: [...hulp_rij] },
                highlightedLines: [LINE_OFFSET + 18],
                description: `a[${k}] ← hulp_rij[${k}] (=${arr[k]})`,
                callStack: getCallStack(),
            }
        }

        yield {
            visual: { type: 'array', elements: snapshot([], [begin, einde]) },
            variables: { begin, midden, einde, result: [...arr] },
            highlightedLines: [LINE_OFFSET + 19],
            description: `Merge klaar: [${begin}..${einde}] is nu gesorteerd`,
            callStack: getCallStack(),
        }
    }

    function* mergeSortRecursive(begin: number, einde: number): Generator<AlgorithmFrame> {
        const LINE_OFFSET = 1
        
        callStack.push({
            id: `mergeSort-${begin}-${einde}-${callStack.length}`,
            name: 'MergeSortRecursive',
            args: { begin, einde },
        })

        yield {
            visual: { type: 'array', elements: snapshot([begin, einde]) },
            variables: { begin, einde },
            highlightedLines: [LINE_OFFSET],
            description: `Aanroep MergeSortRecursive(a, ${begin}, ${einde})`,
            callStack: getCallStack(),
        }

        yield {
            visual: { type: 'array', elements: snapshot([begin, einde]) },
            variables: { begin, einde, 'begin < einde': begin < einde },
            highlightedLines: [LINE_OFFSET + 1],
            description: `Controleer: begin=${begin} < einde=${einde}?`,
            callStack: getCallStack(),
        }

        if (begin < einde) {
            const midden = Math.floor((begin + einde) / 2)

            yield {
                visual: { type: 'array', elements: snapshot([begin, midden, einde]) },
                variables: { begin, midden, einde },
                highlightedLines: [LINE_OFFSET + 2],
                description: `Bereken midden ← ⌊(${begin} + ${einde})/2⌋ = ${midden}`,
                callStack: getCallStack(),
            }

            yield {
                visual: { type: 'array', elements: snapshot([begin, midden]) },
                variables: { begin, midden, einde },
                highlightedLines: [LINE_OFFSET + 3],
                description: `Recursief sorteer linkerhelft [${begin}..${midden}]`,
                callStack: getCallStack(),
            }
            yield* mergeSortRecursive(begin, midden)

            yield {
                visual: { type: 'array', elements: snapshot([midden + 1, einde]) },
                variables: { begin, midden, einde },
                highlightedLines: [LINE_OFFSET + 4],
                description: `Terug uit recursie, nu rechterhelft [${midden + 1}..${einde}]`,
                callStack: getCallStack(),
            }
            yield* mergeSortRecursive(midden + 1, einde)

            yield {
                visual: { type: 'array', elements: snapshot([begin, midden, einde]) },
                variables: { begin, midden, einde },
                highlightedLines: [LINE_OFFSET + 5],
                description: `Terug uit recursie, voeg [${begin}..${midden}] en [${midden + 1}..${einde}] samen`,
                callStack: getCallStack(),
            }
            yield* merge(begin, midden, einde)
        } else {
            yield {
                visual: { type: 'array', elements: snapshot([begin]) },
                variables: { begin, einde },
                highlightedLines: [LINE_OFFSET + 6],
                description: `begin ≥ einde → bereik heeft 0 of 1 element, al gesorteerd`,
                callStack: getCallStack(),
            }
        }

        callStack.pop()
    }

    if (arr.length > 0) {
        yield* mergeSortRecursive(0, arr.length - 1)
    }

    yield {
        visual: { type: 'array', elements: snapshot([], arr.length > 0 ? [0, arr.length - 1] : null) },
        variables: { result: [...arr] },
        highlightedLines: [7, 27],
        description: 'Klaar! De volledige array is gesorteerd.',
        callStack: getCallStack(),
    }
}

export const mergeSortDefinition: AnyAlgorithmDefinition = defineAlgorithm<Input>({
    id: 'merge-sort',
    name: 'Samenvoegen',
    category: 'sorting',
    visualType: 'array',
    defaultInputId: 'classic',
    showCallStack: true,
    inputs: [
        {
            id: 'classic',
            name: 'Classic array',
            input: { values: [64, 34, 25, 12, 22, 11, 90] },
        },
        {
            id: 'nearly-sorted',
            name: 'Nearly sorted',
            input: { values: [11, 12, 22, 25, 34, 90, 64] },
        },
        {
            id: 'reversed',
            name: 'Reversed',
            input: { values: [90, 64, 34, 25, 22, 12, 11] },
        },
    ],
    pythonCode: pseudoCode,
    run,
})