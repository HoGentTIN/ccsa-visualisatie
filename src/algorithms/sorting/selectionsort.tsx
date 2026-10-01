import type { AlgorithmFrame, ArrayElement, AnyAlgorithmDefinition } from '@/algorithms/shared/types'
import { defineAlgorithm } from '@/algorithms/shared/types'

type Input = { values: number[] }

const pseudoCode = `# Invoer De array 𝑎 is gevuld met 𝑛 elementen.
# Uitvoer De array 𝑎 is gesorteerd.
function SELECTIONSORT(𝑎)
    for 𝑖 = 𝑛 − 1 … 1 by − 1 do # achteraan starten
        positie ← 𝑖
        max ← 𝑎[𝑖]
        for 𝑗 = 𝑖 − 1 … 0 by − 1 do # 𝑗 doorloopt de deelrij
            if 𝑎[𝑗] > max then
                positie ← 𝑗
                max ← 𝑎[𝑗]
        𝑎[positie] ← 𝑎[𝑖] # grootste element wisselen met laatste
        𝑎[𝑖] ← max
end function`

function* run(input: Input): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3
    const arr = [...input.values]
    const n = arr.length

    const snapshot = (
        activeIndices: number[] = [],
        sortedFrom: number = n,
    ): ArrayElement[] =>
        arr.map((value, idx) => ({
            id: String(idx),
            value,
            status: idx >= sortedFrom
                ? 'sorted'
                : activeIndices.includes(idx)
                    ? 'comparing'
                    : 'default',
        }))

    // Start van algoritme
    yield {
        visual: { type: 'array', elements: snapshot([]) },
        variables: { n, a: [...arr] },
        highlightedLines: [LINE_OFFSET + 1],
        description: `Start SELECTIONSORT met array van ${n} elementen`,
    }

    // Buitenste lus: van n-1 naar 1
    for (let i = n - 1; i >= 1; i--) {
        yield {
            visual: { type: 'array', elements: snapshot([i], i + 1) },
            variables: { n, i },
            highlightedLines: [LINE_OFFSET + 1],
            description: `Start nieuwe iteratie: i ← ${i} (zoek grootste element voor positie ${i})`,
        }

        let positie = i
        yield {
            visual: { type: 'array', elements: snapshot([positie], i + 1) },
            variables: { n, i, positie },
            highlightedLines: [LINE_OFFSET + 2],
            description: `Initialiseer positie ← ${positie} (begin met laatste positie)`,
        }

        let max = arr[i]
        yield {
            visual: { type: 'array', elements: snapshot([i], i + 1) },
            variables: { n, i, positie, max, 'a[i]': arr[i] },
            highlightedLines: [LINE_OFFSET + 3],
            description: `Initialiseer max ← a[${i}] = ${max} (huidige maximum)`,
        }

        // Binnenste lus: doorloop de ongesorteerde deelrij
        for (let j = i - 1; j >= 0; j--) {
            yield {
                visual: { type: 'array', elements: snapshot([j], i + 1) },
                variables: { n, i, j, positie, max },
                highlightedLines: [LINE_OFFSET + 4],
                description: `Innerlijke lus: j ← ${j} (ga a[${j}] bekijken)`,
            }

            yield {
                visual: { type: 'array', elements: snapshot([positie, j], i + 1) },
                variables: { n, i, j, positie, max, 'a[j]': arr[j] },
                highlightedLines: [LINE_OFFSET + 5],
                description: `Vergelijk: a[${j}]=${arr[j]} > max=${max}?`,
            }

            if (arr[j] > max) {
                yield {
                    visual: { type: 'array', elements: snapshot([j], i + 1) },
                    variables: { n, i, j, positie, max, 'a[j]': arr[j] },
                    highlightedLines: [LINE_OFFSET + 5],
                    description: `JA! a[${j}]=${arr[j]} is groter dan ${max}`,
                }

                positie = j
                yield {
                    visual: { type: 'array', elements: snapshot([positie], i + 1) },
                    variables: { n, i, j, positie, max, 'a[j]': arr[j] },
                    highlightedLines: [LINE_OFFSET + 6],
                    description: `Update positie ← ${positie} (nieuw maximum gevonden)`,
                }

                max = arr[j]
                yield {
                    visual: { type: 'array', elements: snapshot([positie], i + 1) },
                    variables: { n, i, j, positie, max },
                    highlightedLines: [LINE_OFFSET + 7],
                    description: `Update max ← a[${j}] = ${max}`,
                }
            } else {
                yield {
                    visual: { type: 'array', elements: snapshot([positie, j], i + 1) },
                    variables: { n, i, j, positie, max, 'a[j]': arr[j] },
                    highlightedLines: [LINE_OFFSET + 5],
                    description: `NEE, a[${j}]=${arr[j]} ≤ ${max}, ga verder`,
                }
            }
        }

        // Einde binnenste lus - nu wisselen
        yield {
            visual: { type: 'array', elements: snapshot([positie, i], i + 1) },
            variables: { n, i, positie, max, 'a[positie]': arr[positie], 'a[i]': arr[i] },
            highlightedLines: [LINE_OFFSET + 8],
            description: `Maximum gevonden op positie ${positie}, wissel met positie ${i}`,
        }

        // Wissel arr[positie] en arr[i]
        const temp = arr[i]
        arr[positie] = temp
        yield {
            visual: { type: 'array', elements: snapshot([positie, i], i + 1) },
            variables: { n, i, positie, max, 'a[positie]': arr[positie], 'a[i]': arr[i] },
            highlightedLines: [LINE_OFFSET + 8],
            description: `Stap 1 van wissel: a[${positie}] ← a[${i}] (=${temp})`,
        }

        arr[i] = max
        yield {
            visual: { type: 'array', elements: snapshot([i], i) },
            variables: { n, i, positie, max, 'a[i]': arr[i] },
            highlightedLines: [LINE_OFFSET + 9],
            description: `Stap 2 van wissel: a[${i}] ← max (=${max}). Positie ${i} is nu gesorteerd!`,
        }
    }

    // Klaar
    yield {
        visual: { type: 'array', elements: snapshot([], 0) },
        variables: { n, result: [...arr] },
        highlightedLines: [LINE_OFFSET + 10],
        description: 'Klaar! De volledige array is gesorteerd.',
    }
}

export const selectionSortDefinition: AnyAlgorithmDefinition = defineAlgorithm<Input>({
    id: 'selection-sort',
    name: 'Selectie',
    category: 'sorting',
    visualType: 'array',
    defaultInputId: 'classic',
    inputs: [
        {
            id: 'classic',
            name: 'Classic array',
            input: { values: [44, 55, 12, 42, 94, 18, 6, 67] },
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