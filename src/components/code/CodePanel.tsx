import { useEffect, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { EditorView } from '@codemirror/view'
import { useVisualizerStore, selectCurrentFrame } from '@/store/useVisualizerStore'
import { lineHighlightField, setHighlightedLines } from './lineHighlight'

// Light CodeMirror theme
const lightCodeTheme = EditorView.theme({
    '&': {
        backgroundColor: '#ffffff',
        color: '#111827',
        height: '100%',
    },
    '.cm-content': {
        caretColor: '#2563eb',
    },
    '.cm-gutters': {
        backgroundColor: '#f9fafb',
        color: '#6b7280',
        borderRight: '1px solid #e5e7eb',
    },
    '.cm-activeLineGutter': {
        backgroundColor: '#f3f4f6',
    },
    '.cm-activeLine': {
        backgroundColor: 'transparent',
    },
    '.cm-line': {
        color: '#111827',
    },
    '.cm-scroller': {
        backgroundColor: '#ffffff',
    },
})

// Static — never recreated, so CodeMirror doesn't re-mount
const BASE_EXTENSIONS = [python(), lightCodeTheme, lineHighlightField]

export default function CodePanel() {
    const selectedAlgorithm = useVisualizerStore(s => s.selectedAlgorithm)
    const frame             = useVisualizerStore(selectCurrentFrame)
    const editorRef         = useRef<ReactCodeMirrorRef>(null)

    // Update highlights and scroll to keep the first highlighted line in view
    useEffect(() => {
        const view = editorRef.current?.view
        if (!view) return

        const highlighted = frame?.highlightedLines ?? []

        // Update custom highlight decorations
        view.dispatch({
            effects: setHighlightedLines.of(highlighted),
        })

        if (!highlighted.length) return

        const targetLineNumber = highlighted[0]
        if (targetLineNumber <= 0 || targetLineNumber > view.state.doc.lines) return

        // Get document position and block info for the target line
        const line = view.state.doc.line(targetLineNumber)
        const block = view.lineBlockAt(line.from)

        // Center that block in the visible area
        const scrollDom = view.scrollDOM
        const containerHeight = scrollDom.clientHeight
        const desiredTop = Math.max(block.top - containerHeight / 2, 0)

        scrollDom.scrollTop = desiredTop
    }, [frame?.highlightedLines])

    if (!selectedAlgorithm) {
        return (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm bg-white">
                Code will appear here
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white text-neutral-950">
            <h2 className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-2 shrink-0">
                {selectedAlgorithm.name} — pseudocode
            </h2>

            <div className="flex-1 overflow-hidden rounded-md border border-neutral-200 bg-white">
                <CodeMirror
                    ref={editorRef}
                    value={selectedAlgorithm.pythonCode}
                    extensions={BASE_EXTENSIONS}
                    editable={false}
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: false,
                        highlightActiveLine: false,
                        highlightSelectionMatches: false,
                    }}
                    style={{ height: '100%' }}
                />
            </div>

            {frame?.description && (
                <p className="mt-2 text-xs text-amber-700 italic shrink-0 truncate">
                    {frame.description}
                </p>
            )}
        </div>
    )
}