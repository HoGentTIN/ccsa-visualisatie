import { useEffect } from 'react'
import AppShell      from '@/components/layout/AppShell'
import CanvasRouter  from '@/components/canvas/CanvasRouter'
import CodePanel     from '@/components/code/CodePanel'
import VariablePanel from '@/components/code/VariablePanel'
import CallStackPanel from '@/components/code/CallStackPanel'
import { useVisualizerStore } from '@/store/useVisualizerStore'
import { useAlgorithmRunner } from '@/hooks/useAlgorithmRunner'
import { useFramePlayer }     from '@/hooks/useFramePlayer'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ALL_ALGORITHMS }     from '@/algorithms'

export default function App() {
  const registerAlgorithms = useVisualizerStore(s => s.registerAlgorithms)
  const selectedAlgorithm = useVisualizerStore(s => s.selectedAlgorithm)

  const showCallStack = selectedAlgorithm?.showCallStack ?? false

  useAlgorithmRunner()
  useFramePlayer()
  useKeyboardShortcuts()

  useEffect(() => {
    registerAlgorithms(ALL_ALGORITHMS)
  }, [])

  return (
      <AppShell
          canvas={<CanvasRouter />}
          code={<CodePanel />}
          variables={<VariablePanel />}
          callStack={showCallStack ? <CallStackPanel /> : undefined}
      />
  )
}