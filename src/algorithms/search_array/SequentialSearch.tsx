import { defineAlgorithm } from '@/algorithms/shared/types'
import type { AlgorithmFrame, SearchArrayElement } from '@/algorithms/shared/types'

type Input = {
    rij: unknown[]   // the array to search in
    zoekItem: unknown
}

const pseudoCode = `# Invoer Een item zoekItem dat moet gevonden worden, een array van items genaamd rij met lengte 𝑛.
# Uitvoer de index van het eerste element in rij dat gelijk is aan zoekItem wordt teruggegeven of −1 indien zoekItem niet voorkomt in rij.
function ZOEKSEQUENTIEEL(zoekItem, rij)
    𝑖 ← 0 # overloopt de posities
    while 𝑖 < 𝑛 and rij[𝑖] ≠ zoekItem do
        𝑖 ← 𝑖 + 1
    if 𝑖 = 𝑛 then # niet gevonden
        index ← −1
    else
        index ← 𝑖 # gevonden
    return index
end function`

function* run(input: Input): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3 // function line is OFFSET+1

    const { rij, zoekItem } = input
    const n = rij.length

    const elements: SearchArrayElement[] = rij.map((v, i) => ({
        id: String(i),
        value: v,
    }))

    // For visualization only: where is the first occurrence of zoekItem?
    const targetIndex = rij.findIndex(v => v === zoekItem)

    const makeVisual = (currentIndex: number | undefined): AlgorithmFrame['visual'] => ({
        type: 'search-array',
        elements,
        targetIndex: targetIndex >= 0 ? targetIndex : -1,
        currentIndex,
    })

    let i = 0
    let index = -1

    // Start: show input and explain
    yield {
        visual: makeVisual(undefined),
        variables: { zoekItem, rij: [...rij], n },
        highlightedLines: [LINE_OFFSET + 1],
        description: `Start ZOEKSEQUENTIEEL(zoekItem=${String(
            zoekItem,
        )}, rij) met lengte n = ${n}.`,
    }

    // i ← 0
    i = 0
    yield {
        visual: makeVisual(undefined),
        variables: { zoekItem, rij: [...rij], n, i },
        highlightedLines: [LINE_OFFSET + 2],
        description: 'Initialiseer i ← 0 (we starten vooraan in de rij).',
    }

    // while i < n and rij[i] ≠ zoekItem do ...
    while (true) {
        const condition =
            i < n && (n === 0 ? true : rij[i] !== zoekItem)

        // Frame: evaluate while condition
        yield {
            visual: makeVisual(i < n ? i : undefined),
            variables: {
                zoekItem,
                rij: [...rij],
                n,
                i,
                'i < n': i < n,
                'rij[i]': i < n ? rij[i] : undefined,
                'rij[i] ≠ zoekItem': i < n ? rij[i] !== zoekItem : undefined,
                'while-cond': condition,
            },
            highlightedLines: [LINE_OFFSET + 3],
            description:
                i < n
                    ? `Controleer while: i=${i} < n=${n} EN rij[${i}]=${String(
                        rij[i],
                    )} ≠ zoekItem=${String(zoekItem)} ?`
                    : `Controleer while: i=${i} < n=${n}? (i is al buiten de rij).`,
        }

        if (!condition) {
            // Exit while
            yield {
                visual: makeVisual(i < n ? i : undefined),
                variables: { zoekItem, rij: [...rij], n, i },
                highlightedLines: [LINE_OFFSET + 3],
                description:
                    'While-voorwaarde is FALSE → lus stopt, ga verder met if i = n.',
            }
            break
        }

        // We are in the loop body, so we know rij[i] ≠ zoekItem and i < n.
        // i ← i + 1
        const oldI = i
        i = i + 1
        yield {
            visual: makeVisual(oldI),
            variables: {
                zoekItem,
                rij: [...rij],
                n,
                'i (oud)': oldI,
                'i (nieuw)': i,
            },
            highlightedLines: [LINE_OFFSET + 4],
            description: `zoekItem nog niet gevonden op index ${oldI} → verhoog i ← i + 1 = ${i}.`,
        }
    }

    // if i = n then ... else ...
    const iEqualsN = i === n

    // Frame: test i = n
    yield {
        visual: makeVisual(i < n ? i : undefined),
        variables: {
            zoekItem,
            rij: [...rij],
            n,
            i,
            'i = n': iEqualsN,
        },
        highlightedLines: [LINE_OFFSET + 5],
        description: `Controleer: i = n? (${i} = ${n})`,
    }

    if (iEqualsN) {
        // index ← -1
        index = -1
        yield {
            visual: makeVisual(undefined),
            variables: { zoekItem, rij: [...rij], n, i, index },
            highlightedLines: [LINE_OFFSET + 6],
            description:
                'JA, i = n → zoekItem werd niet gevonden → index ← -1.',
        }
    } else {
        // index ← i
        index = i
        yield {
            visual: makeVisual(i),
            variables: { zoekItem, rij: [...rij], n, i, index },
            highlightedLines: [LINE_OFFSET + 8],
            description: `NEE, i ≠ n → zoekItem gevonden op positie i = ${i} → index ← ${i}.`,
        }
    }

    // return index
    yield {
        visual: makeVisual(i < n ? i : undefined),
        variables: { zoekItem, rij: [...rij], n, i, index },
        highlightedLines: [LINE_OFFSET + 9],
        description: `Geef index terug: ${index}.`,
    }
}

export const sequentialSearchDefinition = defineAlgorithm<Input>({
    id: 'sequential-search',
    name: 'Sequentieel Zoeken',
    category: 'search_array',
    visualType: 'array', // still "array" category-wise; uses internal 'search-array' visual
    defaultInputId: 'classic',
    inputs: [
        {
            id: 'classic',
            name: 'Klein voorbeeld',
            input: {
                rij: [3, 5, 2, 7, 9, 7, 3, 12, 4, 10],
                zoekItem: 7,
            },
        },
        {
            id: 'not-found',
            name: 'Niet gevonden',
            input: {
                rij: [1, 3, 5, 7, 9, 11, 12, 14],
                zoekItem: 4,
            },
        },
    ],
    pythonCode: pseudoCode,
    run,
})