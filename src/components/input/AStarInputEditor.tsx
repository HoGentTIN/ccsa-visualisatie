// import { useState, useCallback } from 'react'
// import type { InputEditorProps } from '@/algorithms/shared/types'
// import type { AStarInput } from '@/algorithms/search/astar'
// import { GraphInputEditor } from './GraphInputEditor'
//
// // Small wrapper around the graph editor + heuristic table
// export function AStarInputEditor({ value, onChange }: InputEditorProps<AStarInput>) {
//     const [draft, setDraft] = useState<AStarInput>(value)
//
//     const apply = useCallback((next: AStarInput) => {
//         setDraft(next)
//         onChange(next)
//     }, [onChange])
//
//     const updateHeuristic = (nodeId: string, raw: string) => {
//         const nextValue = Number(raw)
//         const next = {
//             ...draft,
//             heuristic: {
//                 ...draft.heuristic,
//                 [nodeId]: Number.isFinite(nextValue) ? nextValue : 0,
//             },
//         }
//         apply(next)
//     }
//
//     return (
//         <div className="flex flex-col gap-4">
//             <GraphInputEditor value={draft as any} onChange={apply as any} />
//
//             <div>
//                 <p className="text-neutral-400 mb-2">Heuristic table</p>
//                 <div className="rounded border border-neutral-700 overflow-hidden">
//                     <table className="w-full text-sm">
//                         <thead className="bg-neutral-800 text-neutral-400">
//                         <tr>
//                             <th className="text-left px-3 py-2">Node</th>
//                             <th className="text-left px-3 py-2">h(n)</th>
//                         </tr>
//                         </thead>
//                         <tbody>
//                         {draft.nodes.map(node => (
//                             <tr key={node.id} className="border-t border-neutral-800">
//                                 <td className="px-3 py-2 text-white font-mono">{node.label}</td>
//                                 <td className="px-3 py-2">
//                                     <input
//                                         type="number"
//                                         className="w-24 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
//                                         value={draft.heuristic[node.id] ?? 0}
//                                         onChange={e => updateHeuristic(node.id, e.target.value)}
//                                     />
//                                 </td>
//                             </tr>
//                         ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     )
// }