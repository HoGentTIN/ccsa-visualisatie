import { defineAlgorithm } from '@/algorithms/shared/types'
import type { AlgorithmFrame, SearchArrayElement } from '@/algorithms/shared/types'

type Input = {
    rij: number[]        // gesorteerde array
    zoekItem: number
}

const pseudoCode = `# Invoer Een item zoekItem dat moet gevonden worden, een gesorteerde array genaamd rij van items van lengte 𝑛.
# Uitvoer de index van het eerste element in rij dat gelijk is aan zoekItem wordt teruggegeven of −1 indien zoekItem niet voorkomt in rij.
function ZOEKbINAIR(zoekItem, rij)
    𝑙 ← 0
    𝑟 ← 𝑛 − 1
    while 𝑙 ≠ 𝑟 do # herhalen totdat slechts één element overblijft
        𝑚 ← ⌊(𝑙 + 𝑟) / 2⌋
        if rij[𝑚] < zoekItem then
            𝑙 ← 𝑚 + 1 # in de rechterhelft zoeken
        else
            𝑟 ← 𝑚 # in de linkerhelft zoeken
    if rij[𝑙] = zoekItem then
        index ← 𝑙
    else
        index ← −1
    return index
end function`

function* run(input: Input): Generator<AlgorithmFrame> {
    const LINE_OFFSET = 3 // function-regel is LINE_OFFSET+1

    const { rij, zoekItem } = input
    const n = rij.length

    const elements: SearchArrayElement[] = rij.map((v, i) => ({
        id: String(i),
        value: v,
    }))

    // Voor de visualisatie: waar ligt de eerste occurrence?
    const targetIndex = rij.findIndex(v => v === zoekItem)

    const makeVisual = (currentIndex: number | undefined): AlgorithmFrame['visual'] => ({
        type: 'search-array',
        elements,
        targetIndex: targetIndex >= 0 ? targetIndex : -1,
        currentIndex,
    })

    // Variabelen uit de pseudocode
    let l = 0
    let r = n - 1
    let m = 0
    let index = -1

    // Startframe
    yield {
        visual: makeVisual(undefined),
        variables: { zoekItem, rij: [...rij], n },
        highlightedLines: [LINE_OFFSET + 1],
        description: `Start ZOEKbINAIR(zoekItem=${zoekItem}, rij) met n = ${n}.`,
    }

    // l ← 0
    l = 0
    yield {
        visual: makeVisual(undefined),
        variables: { zoekItem, rij: [...rij], n, l, r },
        highlightedLines: [LINE_OFFSET + 2],
        description: 'Initialiseer l ← 0 (linkergrens).',
    }

    // r ← n − 1
    r = n - 1
    yield {
        visual: makeVisual(undefined),
        variables: { zoekItem, rij: [...rij], n, l, r },
        highlightedLines: [LINE_OFFSET + 3],
        description: `Initialiseer r ← n − 1 = ${r} (rechtergrens).`,
    }

    // while l ≠ r do
    while (true) {
        const cond = l !== r

        yield {
            visual: makeVisual(cond ? Math.floor((l + r) / 2) : undefined),
            variables: {
                zoekItem,
                rij: [...rij],
                n,
                l,
                r,
                'l ≠ r': cond,
            },
            highlightedLines: [LINE_OFFSET + 4],
            description: `Controleer while: l=${l} ≠ r=${r}?`,
        }

        if (!cond) {
            // lus stopt – nog één kandidaat over
            yield {
                visual: makeVisual(l),
                variables: { zoekItem, rij: [...rij], n, l, r },
                highlightedLines: [LINE_OFFSET + 4],
                description:
                    'While-voorwaarde is FALSE → er blijft precies één kandidaatindex over.',
            }
            break
        }

        // m ← ⌊(l + r)/2⌋
        m = Math.floor((l + r) / 2)
        yield {
            visual: makeVisual(m),
            variables: {
                zoekItem,
                rij: [...rij],
                n,
                l,
                r,
                m,
            },
            highlightedLines: [LINE_OFFSET + 5],
            description: `Bereken m ← ⌊(l + r)/2⌋ = ⌊(${l} + ${r})/2⌋ = ${m}.`,
        }

        // if rij[m] < zoekItem then ...
        const valueAtM = rij[m]
        const isLess = valueAtM < zoekItem

        yield {
            visual: makeVisual(m),
            variables: {
                zoekItem,
                rij: [...rij],
                n,
                l,
                r,
                m,
                'rij[m]': valueAtM,
                'rij[m] < zoekItem': isLess,
            },
            highlightedLines: [LINE_OFFSET + 6],
            description: `Vergelijk rij[m]=${valueAtM} met zoekItem=${zoekItem}: ${valueAtM} < ${zoekItem}?`,
        }

        if (isLess) {
            // l ← m + 1
            const oldL = l
            l = m + 1
            yield {
                visual: makeVisual(m),
                variables: {
                    zoekItem,
                    rij: [...rij],
                    n,
                    l,
                    r,
                    m,
                    'l (oud)': oldL,
                    'l (nieuw)': l,
                },
                highlightedLines: [LINE_OFFSET + 7],
                description: `JA → zoek in de rechterhelft: l ← m + 1 = ${m} + 1 = ${l}.`,
            }
        } else {
            // r ← m
            const oldR = r
            r = m
            yield {
                visual: makeVisual(m),
                variables: {
                    zoekItem,
                    rij: [...rij],
                    n,
                    l,
                    r,
                    m,
                    'r (oud)': oldR,
                    'r (nieuw)': r,
                },
                highlightedLines: [LINE_OFFSET + 8],
                description: `NEE → zoek in de linkerhelft (inclusief m): r ← m = ${m}.`,
            }
        }
    }

    // Na de while: l == r, eventueel lege rij afhandelen
    if (n === 0) {
        // Speciale case: lege rij, we hebben l = 0, r = -1 → while is nooit in gegaan
        index = -1
        yield {
            visual: makeVisual(undefined),
            variables: { zoekItem, rij: [...rij], n, index },
            highlightedLines: [LINE_OFFSET + 9, LINE_OFFSET + 11],
            description: 'Lege rij: zoekItem kan niet voorkomen → index ← -1.',
        }
    } else {
        // if rij[l] = zoekItem then ...
        const valueAtL = rij[l]
        const isEqual = valueAtL === zoekItem

        yield {
            visual: makeVisual(l),
            variables: {
                zoekItem,
                rij: [...rij],
                n,
                l,
                r,
                'rij[l]': valueAtL,
                'rij[l] = zoekItem': isEqual,
            },
            highlightedLines: [LINE_OFFSET + 9],
            description: `Controleer: rij[l]=${valueAtL} = zoekItem=${zoekItem}?`,
        }

        if (isEqual) {
            index = l
            yield {
                visual: makeVisual(l),
                variables: { zoekItem, rij: [...rij], n, l, index },
                highlightedLines: [LINE_OFFSET + 10],
                description: `JA → index ← l = ${l}.`,
            }
        } else {
            index = -1
            yield {
                visual: makeVisual(l),
                variables: { zoekItem, rij: [...rij], n, l, index },
                highlightedLines: [LINE_OFFSET + 12],
                description: `NEE → zoekItem komt niet voor → index ← -1.`,
            }
        }
    }

    // return index
    yield {
        visual: makeVisual(index >= 0 ? index : undefined),
        variables: { zoekItem, rij: [...rij], n, l, r, index },
        highlightedLines: [LINE_OFFSET + 13],
        description: `Geef index terug: ${index}.`,
    }
}

export const binarySearchDefinition = defineAlgorithm<Input>({
    id: 'binary-search',
    name: 'Binair Zoeken',
    category: 'search_array',
    visualType: 'array', // gebruikt intern de 'search-array' visual
    defaultInputId: 'classic-found',
    inputs: [
        {
            id: 'classic-found',
            name: 'Gevonden (midden)',
            input: {
                rij: [1, 3, 5, 7, 9, 11, 13],
                zoekItem: 7,
            },
        },
        {
            id: 'left-side',
            name: 'Gevonden (linkerhelft)',
            input: {
                rij: [2, 4, 6, 8, 10, 12],
                zoekItem: 4,
            },
        },
        {
            id: 'not-found',
            name: 'Niet gevonden',
            input: {
                rij: [1, 3, 5, 7, 9],
                zoekItem: 6,
            },
        },
    ],
    pythonCode: pseudoCode,
    run,
})