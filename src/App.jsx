import { useState } from 'react'
import InputArea from './components/InputArea'
import ControlBar from './components/ControlBar'
import MaskedTextDisplay from './components/MaskedTextDisplay'
import { useMasker } from './hooks/useMasker'

function App() {
  const [percentage, setPercentage] = useState(50)
  const {
    originalText,
    segments,
    maskedIndices,
    revealedIndex,
    setText,
    applyMask,
    revealSegment
  } = useMasker()

  const handleMask = () => {
    applyMask(percentage)
  }

  const hasText = originalText.trim().length > 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Text Masker</h1>
        <p className="app-subtitle">文字背书工具</p>
      </header>

      <main className="app-main">
        <InputArea
          value={originalText}
          onTextChange={setText}
        />

        <ControlBar
          percentage={percentage}
          onPercentageChange={setPercentage}
          onMask={handleMask}
          hasText={hasText}
        />

        <MaskedTextDisplay
          segments={segments}
          maskedIndices={maskedIndices}
          revealedIndex={revealedIndex}
          onReveal={revealSegment}
        />
      </main>
    </div>
  )
}

export default App