import { StateEffect, StateField, RangeSetBuilder } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view'

// Dispatch this effect with an array of 1-indexed line numbers to highlight
export const setHighlightedLines = StateEffect.define<number[]>()

export const lineHighlightField = StateField.define<DecorationSet>({
    create: () => Decoration.none,

    update(deco, tr) {
        deco = deco.map(tr.changes)
        for (const effect of tr.effects) {
            if (effect.is(setHighlightedLines)) {
                const lines = new Set(effect.value)
                const builder = new RangeSetBuilder<Decoration>()
                for (let i = 1; i <= tr.state.doc.lines; i++) {
                    if (lines.has(i)) {
                        const line = tr.state.doc.line(i)
                        builder.add(
                            line.from,
                            line.from,
                            Decoration.line({ attributes: { class: 'cm-exec-line' } })
                        )
                    }
                }
                deco = builder.finish()
            }
        }
        return deco
    },

    provide: f => EditorView.decorations.from(f),
})