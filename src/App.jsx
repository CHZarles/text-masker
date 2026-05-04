import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useMasker } from './hooks/useMasker'
import './styles/index.css'

function App() {
  const [page, setPage] = useState('study')
  const [percentage, setPercentage] = useState(50)
  const {
    originalText,
    tokens,
    maskedIndices,
    revealedIndices,
    isMarkdown,
    setText,
    applyMask,
    revealToken
  } = useMasker()

  const handleMask = () => {
    applyMask(percentage)
  }

  const handlePaste = () => {
    setPage('paste')
  }

  const handleSave = () => {
    setPage('study')
  }

  // 渲染带掩码的内容
  const renderContent = () => {
    if (!originalText) return null

    // 如果是 Markdown，用 ReactMarkdown 渲染
    // 但需要特殊处理来支持掩码
    if (isMarkdown) {
      return <MarkdownWithMask
        text={originalText}
        tokens={tokens}
        maskedIndices={maskedIndices}
        revealedIndices={revealedIndices}
        onReveal={revealToken}
      />
    }

    // 普通文本
    return renderText(originalText, tokens, maskedIndices, revealedIndices, revealToken)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">背书</div>
        <nav className="sidebar-nav">
          <button
            className={`nav-btn ${page === 'study' ? 'active' : ''}`}
            onClick={() => setPage('study')}
          >
            背诵
          </button>
          <button
            className={`nav-btn ${page === 'paste' ? 'active' : ''}`}
            onClick={() => handlePaste()}
          >
            粘贴
          </button>
        </nav>
        <div className="sidebar-controls">
          <div className="percentage-control">
            <span className="percentage-value">{percentage}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="percentage-slider"
            />
          </div>
          <button
            className="mask-btn"
            onClick={handleMask}
            disabled={!originalText.trim()}
          >
            开始背诵
          </button>
        </div>
      </aside>

      <main className="main">
        {page === 'study' ? (
          <div className="study-area">
            {tokens.length === 0 && !originalText ? (
              <div className="empty-state">
                <p>还没有文本</p>
                <button className="go-paste-btn" onClick={handlePaste}>
                  去粘贴
                </button>
              </div>
            ) : (
              <div className="text-display">
                {renderContent()}
              </div>
            )}
          </div>
        ) : (
          <div className="paste-area">
            <textarea
              className="paste-input"
              placeholder="在此粘贴要背诵的内容..."
              value={originalText}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="paste-actions">
              <button className="save-btn" onClick={() => handleSave(originalText)}>
                保存并开始背诵
              </button>
              <button className="cancel-btn" onClick={() => setPage('study')}>
                取消
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// 普通文本渲染
function renderText(text, tokens, maskedIndices, revealedIndices, onReveal) {
  const elements = []
  let lastEnd = 0

  tokens.forEach((token, index) => {
    if (token.start > lastEnd) {
      elements.push(
        <span key={`pre-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
          {text.slice(lastEnd, token.start)}
        </span>
      )
    }

    const isMasked = maskedIndices.has(index)
    const isRevealed = revealedIndices.has(index)

    if (isMasked && !isRevealed) {
      elements.push(
        <span
          key={`mask-${index}`}
          className="masked-text"
          onClick={() => onReveal(index)}
        >
          {token.text}
        </span>
      )
    } else {
      elements.push(
        <span key={`text-${index}`}>
          {token.text}
        </span>
      )
    }

    lastEnd = token.end
  })

  if (lastEnd < text.length) {
    elements.push(
      <span key="post" style={{ whiteSpace: 'pre-wrap' }}>
        {text.slice(lastEnd)}
      </span>
    )
  }

  return elements
}

// Markdown 渲染（保持格式 + 掩码）
function MarkdownWithMask({ text, tokens, maskedIndices, revealedIndices, onReveal }) {
  // 将文本按行分割，每行单独处理
  const lines = text.split('\n')

  return (
    <div className="markdown-content">
      {lines.map((line, lineIndex) => {
        // 找到该行对应的 tokens
        const lineTokens = tokens.filter(token => {
          const startLine = text.substring(0, token.start).split('\n').length - 1
          const endLine = text.substring(0, token.end).split('\n').length - 1
          return startLine === lineIndex || endLine === lineIndex
        })

        return (
          <div key={lineIndex} className="markdown-line">
            {lineTokens.length > 0 ? (
              renderLineWithMask(line, lineTokens, tokens, maskedIndices, revealedIndices, onReveal)
            ) : (
              <span style={{ whiteSpace: 'pre-wrap' }}>{line}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 单行文本的掩码渲染
function renderLineWithMask(line, lineTokens, allTokens, maskedIndices, revealedIndices, onReveal) {
  const elements = []
  let lastEnd = 0

  // 找到该行在原文中的起始位置
  const lineStartInText = allTokens.length > 0
    ? (lineTokens[0]?.start ?? 0)
    : 0

  lineTokens.forEach((token) => {
    // 计算 token 在当前行内的相对位置
    const relativeStart = token.start - lineStartInText

    // 添加该 token 之前的内容
    if (relativeStart > lastEnd) {
      elements.push(
        <span key={`pre-${token.id}`}>
          {line.slice(lastEnd, relativeStart)}
        </span>
      )
    }

    const isMasked = maskedIndices.has(allTokens.indexOf(token))
    const isRevealed = revealedIndices.has(allTokens.indexOf(token))

    if (isMasked && !isRevealed) {
      elements.push(
        <span
          key={`mask-${token.id}`}
          className="masked-text"
          onClick={() => onReveal(allTokens.indexOf(token))}
        >
          {token.text}
        </span>
      )
    } else {
      elements.push(
        <span key={`text-${token.id}`}>
          {token.text}
        </span>
      )
    }

    lastEnd = relativeStart + token.text.length
  })

  // 添加行尾内容
  if (lastEnd < line.length) {
    elements.push(
      <span key={`post-${lineStartInText}`}>
        {line.slice(lastEnd)}
      </span>
    )
  }

  return elements
}

export default App