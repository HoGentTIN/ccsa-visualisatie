// import { useState, useCallback } from 'react'
// import type { InputEditorProps } from '@/algorithms/shared/types'
//
// // ── Simple force-directed layout ────────────────────────────────────────────
//
// interface LayoutNode { id: string; x: number; y: number }
// interface LayoutEdge { source: string; target: string }
//
// function forceLayout(
//     nodes: LayoutNode[],
//     edges: LayoutEdge[],
//     { width = 700, height = 400, iterations = 200, startId = '', endId = '' } = {},
// ): LayoutNode[] {
//     if (nodes.length === 0) return []
//     if (nodes.length === 1) return [{ ...nodes[0], x: width / 2, y: height / 2 }]
//
//     // Initialize positions in a circle so we start from a reasonable state
//     const cx = width / 2, cy = height / 2, r = Math.min(width, height) * 0.35
//     let positions = nodes.map((n, i) => ({
//         id: n.id,
//         x: cx + r * Math.cos((i / nodes.length) * 2 * Math.PI),
//         y: cy + r * Math.sin((i / nodes.length) * 2 * Math.PI),
//     }))
//
//     const idxMap = new Map(positions.map((n, i) => [n.id, i]))
//     const idealEdgeLen = Math.min(width, height) / (Math.sqrt(nodes.length) + 1)
//     const startIdx = idxMap.get(startId)
//     const endIdx = idxMap.get(endId)
//     const pad = 40
//
//     for (let iter = 0; iter < iterations; iter++) {
//         const t = 1 - iter / iterations // cooling factor
//         const dx = new Float64Array(nodes.length)
//         const dy = new Float64Array(nodes.length)
//
//         // Repulsion between all pairs
//         const repK = idealEdgeLen * idealEdgeLen * 0.5
//         for (let i = 0; i < positions.length; i++) {
//             for (let j = i + 1; j < positions.length; j++) {
//                 let ddx = positions[i].x - positions[j].x
//                 let ddy = positions[i].y - positions[j].y
//                 const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1
//                 const force = repK / dist
//                 ddx = (ddx / dist) * force
//                 ddy = (ddy / dist) * force
//                 dx[i] += ddx; dy[i] += ddy
//                 dx[j] -= ddx; dy[j] -= ddy
//             }
//         }
//
//         // Attraction along edges
//         const attK = 1 / idealEdgeLen
//         for (const e of edges) {
//             const si = idxMap.get(e.source)
//             const ti = idxMap.get(e.target)
//             if (si === undefined || ti === undefined) continue
//             let ddx = positions[ti].x - positions[si].x
//             let ddy = positions[ti].y - positions[si].y
//             const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1
//             const force = dist * attK
//             ddx = (ddx / dist) * force
//             ddy = (ddy / dist) * force
//             dx[si] += ddx; dy[si] += ddy
//             dx[ti] -= ddx; dy[ti] -= ddy
//         }
//
//         // Center gravity
//         for (let i = 0; i < positions.length; i++) {
//             dx[i] += (cx - positions[i].x) * 0.01
//             dy[i] += (cy - positions[i].y) * 0.01
//         }
//
//         // Pin start node to the left, end node to the right
//         if (startIdx !== undefined) {
//             dx[startIdx] += (pad - positions[startIdx].x) * 0.3
//             dy[startIdx] += (cy - positions[startIdx].y) * 0.05
//         }
//         if (endIdx !== undefined) {
//             dx[endIdx] += ((width - pad) - positions[endIdx].x) * 0.3
//             dy[endIdx] += (cy - positions[endIdx].y) * 0.05
//         }
//
//         // Apply with cooling
//         const maxDisp = idealEdgeLen * t + 1
//         positions = positions.map((p, i) => {
//             const len = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]) || 1
//             const capped = Math.min(len, maxDisp)
//             return {
//                 id: p.id,
//                 x: Math.max(pad, Math.min(width - pad, p.x + (dx[i] / len) * capped)),
//                 y: Math.max(pad, Math.min(height - pad, p.y + (dy[i] / len) * capped)),
//             }
//         })
//     }
//
//     return positions.map(p => ({ id: p.id, x: Math.round(p.x), y: Math.round(p.y) }))
// }
//
// // ── Component ──────────────────────────────────────────────────────────────
//
// export function GraphInputEditor({ value, onChange }: InputEditorProps<DijkstraInput>) {
//     const [draft, setDraft] = useState<DijkstraInput>(value)
//     const [edgeInput, setEdgeInput] = useState({ source: '', target: '', weight: '1' })
//     const [error, setError] = useState('')
//
//     const nodeIds = draft.nodes.map(n => n.id)
//
//     const relayout = useCallback((d: DijkstraInput): DijkstraInput => {
//         const laid = forceLayout(d.nodes, d.edges, { startId: d.startId, endId: d.endId })
//         return {
//             ...d,
//             nodes: d.nodes.map(n => {
//                 const pos = laid.find(l => l.id === n.id)
//                 return pos ? { ...n, x: pos.x, y: pos.y } : n
//             }),
//         }
//     }, [])
//
//     function addNode() {
//         const id = String.fromCharCode(65 + draft.nodes.length)
//         if (draft.nodes.length >= 12) { setError('Max 12 nodes'); return }
//         setDraft(d => relayout({
//             ...d,
//             nodes: [...d.nodes, { id, label: id, x: 0, y: 0 }],
//         }))
//         setError('')
//     }
//
//     function removeNode(id: string) {
//         setDraft(d => relayout({
//             ...d,
//             nodes: d.nodes.filter(n => n.id !== id),
//             edges: d.edges.filter(e => e.source !== id && e.target !== id),
//             startId: d.startId === id ? (d.nodes.find(n => n.id !== id)?.id ?? '') : d.startId,
//             endId: d.endId === id ? (d.nodes.find(n => n.id !== id)?.id ?? '') : d.endId,
//         }))
//     }
//
//     function addEdge() {
//         const { source, target, weight } = edgeInput
//         const w = Number(weight)
//
//         if (!source || !target) { setError('Pick both nodes'); return }
//         if (source === target)  { setError("Can't connect a node to itself"); return }
//         if (isNaN(w) || w < 1) { setError('Weight must be ≥ 1'); return }
//
//         const already = draft.edges.find(e =>
//             (e.source === source && e.target === target) ||
//             (e.source === target && e.target === source)
//         )
//         if (already) { setError('Edge already exists'); return }
//
//         const id = `${source}${target}`
//         setDraft(d => relayout({ ...d, edges: [...d.edges, { id, source, target, weight: w }] }))
//         setError('')
//     }
//
//     function removeEdge(id: string) {
//         setDraft(d => relayout({ ...d, edges: d.edges.filter(e => e.id !== id) }))
//     }
//
//     function apply() {
//         if (!draft.startId) { setError('Pick a start node'); return }
//         onChange(draft)
//         setError('')
//     }
//
//     return (
//         <div className="flex flex-col gap-5 text-sm">
//
//             {/* Start node */}
//             <div className="flex items-center gap-3">
//                 <label className="text-neutral-400 w-24 shrink-0">Start node</label>
//                 <select
//                     value={draft.startId}
//                     onChange={e => setDraft(d => relayout({ ...d, startId: e.target.value }))}
//                     className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
//                 >
//                     {draft.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
//                 </select>
//             </div>
//
//             {/* End node */}
//             <div className="flex items-center gap-3">
//                 <label className="text-neutral-400 w-24 shrink-0">End node</label>
//                 <select
//                     value={draft.endId}
//                     onChange={e => setDraft(d => relayout({ ...d, endId: e.target.value }))}
//                     className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
//                 >
//                     {draft.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
//                 </select>
//             </div>
//
//             {/* Nodes */}
//             <div>
//                 <p className="text-neutral-400 mb-2">Nodes <span className="text-neutral-600">({draft.nodes.length})</span></p>
//                 <div className="flex flex-wrap gap-2 mb-2">
//                     {draft.nodes.map(n => (
//                         <span key={n.id} className="flex items-center gap-1 bg-neutral-800 rounded px-2 py-1">
//               <span className="text-white font-mono">{n.label}</span>
//               <button onClick={() => removeNode(n.id)} className="text-neutral-500 hover:text-red-400">×</button>
//             </span>
//                     ))}
//                 </div>
//                 <button onClick={addNode} className="px-3 py-1 rounded bg-neutral-700 text-white hover:bg-neutral-600">
//                     + Add node
//                 </button>
//             </div>
//
//             {/* Add edge */}
//             <div>
//                 <p className="text-neutral-400 mb-2">Add edge</p>
//                 <div className="flex gap-2 items-center flex-wrap">
//                     <select
//                         value={edgeInput.source}
//                         onChange={e => setEdgeInput(ei => ({ ...ei, source: e.target.value }))}
//                         className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
//                     >
//                         <option value="">From</option>
//                         {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
//                     </select>
//                     <span className="text-neutral-600">→</span>
//                     <select
//                         value={edgeInput.target}
//                         onChange={e => setEdgeInput(ei => ({ ...ei, target: e.target.value }))}
//                         className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
//                     >
//                         <option value="">To</option>
//                         {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
//                     </select>
//                     <input
//                         type="number" min={1} max={999}
//                         value={edgeInput.weight}
//                         onChange={e => setEdgeInput(ei => ({ ...ei, weight: e.target.value }))}
//                         placeholder="weight"
//                         className="w-20 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
//                     />
//                     <button onClick={addEdge} className="px-3 py-1 rounded bg-neutral-700 text-white hover:bg-neutral-600">
//                         + Add
//                     </button>
//                 </div>
//             </div>
//
//             {/* Existing edges */}
//             <div>
//                 <p className="text-neutral-400 mb-2">Edges <span className="text-neutral-600">({draft.edges.length})</span></p>
//                 <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
//                     {draft.edges.map(e => (
//                         <div key={e.id} className="flex items-center justify-between bg-neutral-800 rounded px-3 py-1">
//                             <span className="font-mono text-white">{e.source} — {e.target}</span>
//                             <span className="text-neutral-400 ml-4 mr-auto">weight: {e.weight}</span>
//                             <button onClick={() => removeEdge(e.id)} className="text-neutral-500 hover:text-red-400">×</button>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//
//             {error && <p className="text-red-400 text-xs">{error}</p>}
//
//             <button
//                 onClick={apply}
//                 className="ml-auto px-4 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-500"
//             >
//                 Apply
//             </button>
//         </div>
//     )
// }