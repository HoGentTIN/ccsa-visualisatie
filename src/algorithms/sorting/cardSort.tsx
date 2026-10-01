import type {
    AlgorithmFrame,
    ArrayElement,
    AnyAlgorithmDefinition,
} from '@/algorithms/shared/types'
import { defineAlgorithm } from '@/algorithms/shared/types'

type Input = { values: number[] }

const pseudoCode = `# Invoer De array 𝑎 is gevuld met 𝑛 elementen.
# Uitvoer De array 𝑎 is gesorteerd.
function CARDSORT(𝑎)
    for 𝑖 = 1 … 𝑛 − 1 do
        𝑥 ← 𝑎[𝑖] # 𝑥 bevat het in te voegen element
        𝑗 ← 𝑖 # 𝑗 zoekt de juiste positie voor 𝑥
        while 𝑗 > 0 and 𝑥 < 𝑎[𝑗 − 1] do # schuif grotere elementen op
            𝑎[𝑗] ← 𝑎[𝑗 − 1] # schuif 𝑎[𝑗 − 1] eentje op
            𝑗 ← 𝑗 − 1
        𝑎[𝑗] ← 𝑥 # 𝑥 wordt op de juiste positie tussengevoegd
end function`

function* run(input: Input): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3 // "function CARDSORT(a)" staat op lijn 3 in pseudoCode
    const a = [...input.values]
    const n = a.length

    const snapshot = (
        activeIndices: number[] = [],
        sortedUntil: number = -1, // indices 0..sortedUntil zijn "gesorteerd"
    ): ArrayElement[] =>
        a.map((value, idx) => ({
            id: String(idx),
            value,
            status:
                idx <= sortedUntil
                    ? 'sorted'
                    : activeIndices.includes(idx)
                        ? 'comparing'
                        : 'default',
        }))

    // Start
    yield {
        visual: { type: 'array', elements: snapshot([], -1) },
        variables: { n, a: [...a] },
        highlightedLines: [LINE_OFFSET],
        description: `Start CARDSORT met een array van ${n} elementen.`,
    }

    // for i = 1 … n − 1
    for (let i = 1; i <= n - 1; i++) {
        // Toon begin van iteratie: deel 0..i-1 is al gesorteerd
        yield {
            visual: { type: 'array', elements: snapshot([i], i - 1) },
            variables: { n, i, a: [...a] },
            highlightedLines: [LINE_OFFSET + 1],
            description: `Nieuwe iteratie: i ← ${i}. Deelrij a[0..${i - 1}] is al gesorteerd; a[${i}] moet ingevoegd worden.`,
        }

        let x = a[i]
        yield {
            visual: { type: 'array', elements: snapshot([i], i - 1) },
            variables: { n, i, x, 'a[i]': a[i], a: [...a] },
            highlightedLines: [LINE_OFFSET + 2],
            description: `Zet 𝑥 ← a[${i}] = ${x}: dit is het kaartje dat we gaan invoegen.`,
        }

        let j = i
        yield {
            visual: { type: 'array', elements: snapshot([j], i - 1) },
            variables: { n, i, j, x, a: [...a] },
            highlightedLines: [LINE_OFFSET + 3],
            description: `Zet 𝑗 ← ${j}: we zoeken de juiste positie voor 𝑥 in de gesorteerde deelrij links.`,
        }

        // while j > 0 and x < a[j − 1]
        while (j > 0 && x < a[j - 1]) {
            yield {
                visual: { type: 'array', elements: snapshot([j, j - 1], i - 1) },
                variables: {
                    n,
                    i,
                    j,
                    x,
                    'a[j-1]': a[j - 1],
                    'voorwaarde': j > 0 && x < a[j - 1],
                    a: [...a],
                },
                highlightedLines: [LINE_OFFSET + 4],
                description: `Controleer while-voorwaarde: j=${j} > 0 en x=${x} < a[${j - 1}]=${a[j - 1]} → we moeten schuiven.`,
            }

            // a[j] ← a[j − 1]
            a[j] = a[j - 1]
            yield {
                visual: { type: 'array', elements: snapshot([j, j - 1], i - 1) },
                variables: {
                    n,
                    i,
                    j,
                    x,
                    'a[j]': a[j],
                    'a[j-1]': a[j - 1],
                    a: [...a],
                },
                highlightedLines: [LINE_OFFSET + 5],
                description: `Schuif 𝑎[${j - 1}] naar rechts: 𝑎[${j}] ← 𝑎[${j - 1}]. Zo maken we plaats voor 𝑥.`,
            }

            // j ← j − 1
            j = j - 1
            yield {
                visual: { type: 'array', elements: snapshot([j], i - 1) },
                variables: { n, i, j, x, a: [...a] },
                highlightedLines: [LINE_OFFSET + 6],
                description: `Verlaag 𝑗 ← ${j}: we schuiven één positie naar links om verder te vergelijken.`,
            }
        }

        // while faalt: we hebben de juiste plek gevonden voor x
        yield {
            visual: { type: 'array', elements: snapshot([j], i - 1) },
            variables: {
                n,
                i,
                j,
                x,
                'conditie-houdt-op': !(j > 0 && x < a[j - 1]),
                a: [...a],
            },
            highlightedLines: [LINE_OFFSET + 4],
            description: `De while-lus stopt: op positie ${j} hoort het element 𝑥=${x}.`,
        }

        // a[j] ← x
        a[j] = x
        yield {
            visual: { type: 'array', elements: snapshot([j], i) },
            variables: { n, i, j, x, 'a[j]': a[j], a: [...a] },
            highlightedLines: [LINE_OFFSET + 7],
            description: `Voeg 𝑥 tussengevoegd in: 𝑎[${j}] ← ${x}. Nu is a[0..${i}] gesorteerd.`,
        }
    }

    // Klaar
    yield {
        visual: { type: 'array', elements: snapshot([], n - 1) },
        variables: { n, result: [...a] },
        highlightedLines: [LINE_OFFSET + 1, LINE_OFFSET + 7],
        description: 'Klaar! De volledige array is gesorteerd met CARDSORT (insertion sort).',
    }
}

export const cardSortDefinition: AnyAlgorithmDefinition = defineAlgorithm<Input>({
    id: 'card-sort',
    name: 'Tussenvoegen',
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
            input: { values: [5, 9, 11, 12, 13, 14, 4] },
        },
        {
            id: 'reversed',
            name: 'Reversed',
            input: { values: [9, 8, 7, 6, 5, 4, 3, 2] },
        },
    ],
    pythonCode: pseudoCode,
    run,
})