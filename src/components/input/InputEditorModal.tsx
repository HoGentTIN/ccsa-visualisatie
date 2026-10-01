// import { useState } from 'react'
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
// import { useVisualizerStore } from '@/store/useVisualizerStore'
// import { ArrayInputEditor } from './ArrayInputEditor'
// import { GraphInputEditor } from './GraphInputEditor'
// import { AStarInputEditor } from './AStarInputEditor'
//
// // Maps algorithm id → which editor to render.
// // Add an entry here whenever you add a new algorithm with a custom input.
// function EditorBody({
//                         algorithmId,
//                         value,
//                         onChange,
//                         onClose,
//                     }: {
//     algorithmId: string
//     value: unknown
//     onChange: (v: unknown) => void
//     onClose: () => void
// }) {
//     // Wrap onChange to also close the dialog
//     const apply = (v: unknown) => { onChange(v); onClose() }
//
//     if (algorithmId === 'dijkstra') {
//         return <GraphInputEditor value={value as any} onChange={apply} />
//     }
//
//     if (algorithmId === 'astar') {
//         return <AStarInputEditor value={value as any} onChange={apply} />
//     }
//
//     return (
//         <p className="text-neutral-500 text-sm">No editor available for this algorithm.</p>
//     )
// }
//
// export default function InputEditorModal() {
//     const [open, setOpen] = useState(false)
//     const selectedAlgorithm = useVisualizerStore(s => s.selectedAlgorithm)
//     const currentInput      = useVisualizerStore(s => s.currentInput)
//     const setInput          = useVisualizerStore(s => s.setInput)
//
//     if (!selectedAlgorithm) return null
//
//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogTrigger asChild>
//                 <button className="px-3 py-1 text-sm rounded bg-neutral-700 text-neutral-200 hover:bg-neutral-600 transition-colors">
//                     ✎ Edit input
//                 </button>
//             </DialogTrigger>
//
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle className="text-white text-base font-semibold">
//                         Edit input — {selectedAlgorithm.name}
//                     </DialogTitle>
//                 </DialogHeader>
//
//                 <EditorBody
//                     algorithmId={selectedAlgorithm.id}
//                     value={currentInput ?? selectedAlgorithm.defaultInput}
//                     onChange={setInput}
//                     onClose={() => setOpen(false)}
//                 />
//
//                 <div className="absolute top-4 right-4">
//                     <DialogClose className="text-neutral-500 hover:text-white text-xl leading-none">×</DialogClose>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     )
// }