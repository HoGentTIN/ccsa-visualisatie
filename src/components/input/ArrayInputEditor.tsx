// import { useForm, useFieldArray } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import { useEffect } from 'react'
// import type { InputEditorProps } from '@/algorithms/shared/types'
// import type { QuicksortInput } from '@/algorithms/sorting/quicksort'
//
// const schema = z.object({
//     values: z.array(z.object({ val: z.coerce.number().int().min(-999).max(999) }))
//         .min(2, 'Need at least 2 elements')
//         .max(20, 'Max 20 elements'),
// })
// type FormData = z.infer<typeof schema>
//
// // Shared by any algorithm with a { values: number[] } input shape
// export function ArrayInputEditor({ value, onChange }: InputEditorProps<QuicksortInput>) {
//     const { register, control, handleSubmit, reset, formState: { errors } } =
//         useForm<FormData>({
//             resolver: zodResolver(schema) as any,
//             defaultValues: { values: value.values.map(v => ({ val: v })) },
//         })
//
//     const { fields, append, remove } = useFieldArray({ control, name: 'values' })
//
//     // Sync external value changes (e.g. reset)
//     useEffect(() => {
//         reset({ values: value.values.map(v => ({ val: v })) })
//     }, [value])
//
//     const onSubmit = (data: FormData) => {
//         onChange({ values: data.values.map(f => f.val) })
//     }
//
//     return (
//         <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
//             <p className="text-neutral-400 text-sm">
//                 Edit the values to sort. Between 2 and 20 integers.
//             </p>
//
//             <div className="flex flex-wrap gap-2">
//                 {fields.map((field, idx) => (
//                     <div key={field.id} className="flex items-center gap-1">
//                         <input
//                             {...register(`values.${idx}.val`)}
//                             type="number"
//                             className="w-16 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-blue-500"
//                         />
//                         <button
//                             type="button"
//                             onClick={() => remove(idx)}
//                             className="text-neutral-500 hover:text-red-400 text-lg leading-none"
//                         >
//                             ×
//                         </button>
//                     </div>
//                 ))}
//             </div>
//
//             {errors.values && (
//                 <p className="text-red-400 text-xs">{errors.values.message}</p>
//             )}
//
//             <div className="flex gap-2">
//                 <button
//                     type="button"
//                     onClick={() => append({ val: Math.floor(Math.random() * 90) + 10 })}
//                     className="px-3 py-1.5 rounded bg-neutral-700 text-white text-sm hover:bg-neutral-600"
//                 >
//                     + Add
//                 </button>
//                 <button
//                     type="button"
//                     onClick={() => reset({ values: Array.from({ length: 7 }, () => ({ val: Math.floor(Math.random() * 90) + 10 })) })}
//                     className="px-3 py-1.5 rounded bg-neutral-700 text-white text-sm hover:bg-neutral-600"
//                 >
//                     ↺ Randomise
//                 </button>
//                 <button
//                     type="submit"
//                     className="ml-auto px-4 py-1.5 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500"
//                 >
//                     Apply
//                 </button>
//             </div>
//         </form>
//     )
// }