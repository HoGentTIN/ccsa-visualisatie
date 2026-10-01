import { useVisualizerStore } from '@/store/useVisualizerStore'
import type { AlgorithmCategory } from '@/algorithms/shared/types'

const CATEGORY_LABELS: Record<AlgorithmCategory, string> = {
    graph: 'Graafalgoritmes',
    sorting: 'Sorteren',
    search: 'Zoekalgoritmes',
    tree: 'Bomen',
    search_array: 'Zoeken'
}

export default function Sidebar() {
    const {
        algorithms,
        selectedAlgorithm,
        selectedInputId,
        selectAlgorithm,
        selectAlgorithmInput,
    } = useVisualizerStore()

    const grouped = algorithms.reduce<Record<string, typeof algorithms>>((acc, algo) => {
        if (!acc[algo.category]) acc[algo.category] = []
        acc[algo.category].push(algo)
        return acc
    }, {})

    return (
        <aside className="w-64 h-full bg-white border-r border-neutral-200 flex flex-col p-5 gap-7 overflow-y-auto shadow-sm">
            <div>
                <h1 className="text-neutral-950 font-bold text-lg tracking-tight">HOGENT - CCSA</h1>
                <p className="mt-1 text-xs text-neutral-500 font-medium">
                    Algoritme visualisatie
                </p>
            </div>

            {Object.entries(grouped).map(([category, algos]) => (
                <div key={category}>
                    <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">
                        {CATEGORY_LABELS[category as AlgorithmCategory]}
                    </p>
                    <ul className="flex flex-col gap-1">
                        {algos.map(algo => (
                            <li key={algo.id}>
                                <button
                                    onClick={() => selectAlgorithm(algo.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                    ${selectedAlgorithm?.id === algo.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'}`}
                                >
                                    {algo.name}
                                </button>

                                {selectedAlgorithm?.id === algo.id && algo.inputs.length > 1 && (
                                    <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-neutral-200 pl-2">
                                        {algo.inputs.map(inputOption => (
                                            <button
                                                key={inputOption.id}
                                                onClick={() => selectAlgorithmInput(inputOption.id)}
                                                className={`w-full rounded-md px-2 py-1 text-left text-xs font-medium transition-colors ${
                                                    selectedInputId === inputOption.id
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                                                }`}
                                            >
                                                {inputOption.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            <div className="mt-auto flex justify-between items-center gap-3 pt-4 border-t border-neutral-200">
                <a
                    href="https://github.com/HoGentTIN/ccsa-visualisatie"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-neutral-700 transition-colors"
                    aria-label="Bekijk de GitHub repository"
                >
                    {/* Simple GitHub icon (SVG) */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                        fill="currentColor"
                    >
                        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56
                                0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71
                                1.18.08 1.8 1.21 1.8 1.21 1.04 1.79 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.57-2.56-.29-5.26-1.28-5.26-5.7
                                0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.19a10.9 10.9 0 0 1 2.9-.39c.98 0
                                1.97.13 2.9.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.58.23 2.75.11 3.04.75.81 1.2 1.85 1.2 3.11
                                0 4.43-2.7 5.41-5.28 5.69.42.36.8 1.08.8 2.18 0 1.57-.02 2.83-.02 3.22 0 .31.21.67.8.56
                                A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                    </svg>
                </a>

                <img src="./HOGENT_logo.png" width={64} height={64} alt="HOGENT logo" />
            </div>
        </aside>
    )
}