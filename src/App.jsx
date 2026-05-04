import { useState, useRef } from 'react'
import { useMasker } from './hooks/useMasker'
import './styles/index.css'

function App() {
  const [page, setPage] = useState('study')
  const [percentage, setPercentage] = useState(50)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [lineModeEnabled, setLineModeEnabled] = useState(false)
  const [selectedLines, setSelectedLines] = useState(new Set())
  const [showMasked, setShowMasked] = useState(false)
  const textareaRef = useRef(null)

  const {
    documents,
    currentDocId,
    originalText,
    tokens,
    maskedIndices,
    revealedIndices,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    applyMask,
    applyMultiLineMask,
    revealToken
  } = useMasker()

  const textLines = originalText ? originalText.split('\n') : []

  const handleMask = () => {
    if (lineModeEnabled && selectedLines.size > 0) {
      applyMultiLineMask(selectedLines, percentage, originalText)
      setShowMasked(true)
    } else {
      applyMask(percentage)
    }
  }

  const handleLineToggle = (lineIndex) => {
    setSelectedLines(prev => {
      const next = new Set(prev)
      if (next.has(lineIndex)) {
        next.delete(lineIndex)
      } else {
        next.add(lineIndex)
      }
      return next
    })
    setShowMasked(false)
  }

  const handlePrevLine = () => {
    const sorted = [...selectedLines].sort((a, b) => a - b)
    if (sorted.length > 0) {
      const first = sorted[0]
      if (first > 0) {
        const newSet = new Set([first - 1])
        setSelectedLines(newSet)
        applyMultiLineMask(newSet, percentage, originalText)
        setShowMasked(true)
      }
    }
  }

  const handleNextLine = () => {
    const sorted = [...selectedLines].sort((a, b) => a - b)
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1]
      if (last < textLines.length - 1) {
        const newSet = new Set([last + 1])
        setSelectedLines(newSet)
        applyMultiLineMask(newSet, percentage, originalText)
        setShowMasked(true)
      }
    }
  }

  const handleExitLineMode = () => {
    setLineModeEnabled(false)
    setSelectedLines(new Set())
    setShowMasked(false)
    applyMask(percentage)
  }

  const handleEnterLineMode = () => {
    setLineModeEnabled(true)
    if (selectedLines.size === 0) {
      setSelectedLines(new Set([0]))
    }
    setShowMasked(false)
  }

  const handleEdit = () => {
    setEditContent(originalText)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (currentDocId && editContent.trim()) {
      updateDocument(currentDocId, editContent)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除这个文档吗？')) {
      deleteDocument(id)
    }
  }

  const handleSaveDoc = () => {
    const text = textareaRef.current?.value || ''
    if (text.trim()) {
      createDocument(text)
      setPage('study')
    } else {
      alert('请先输入内容')
    }
  }

  const handleSaveAndContinue = () => {
    const text = textareaRef.current?.value || ''
    if (text.trim()) {
      createDocument(text)
      if (textareaRef.current) textareaRef.current.value = ''
    } else {
      alert('请先输入内容')
    }
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
            onClick={() => setPage('paste')}
          >
            粘贴
          </button>
          <button
            className={`nav-btn ${page === 'documents' ? 'active' : ''}`}
            onClick={() => setPage('documents')}
          >
            文档
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
            disabled={!originalText.trim() || (lineModeEnabled && selectedLines.size === 0)}
          >
            {showMasked ? '重新开始' : (lineModeEnabled ? '开始背诵' : '开始背诵')}
          </button>
        </div>
      </aside>

      <main className="main">
        {page === 'study' ? (
          <div className="study-area">
            {isEditing ? (
              <div className="edit-area">
                <textarea
                  className="edit-input"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="在此编辑内容..."
                />
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveEdit}>
                    保存
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    取消
                  </button>
                </div>
              </div>
            ) : tokens.length === 0 && !originalText ? (
              <div className="empty-state">
                <p>还没有选择文档</p>
                <button className="go-paste-btn" onClick={() => setPage('documents')}>
                  选择文档
                </button>
              </div>
            ) : (
              <>
                <div className="mode-toggle">
                  <button
                    className={`mode-btn ${!lineModeEnabled ? 'active' : ''}`}
                    onClick={handleExitLineMode}
                  >
                    全文
                  </button>
                  <button
                    className={`mode-btn ${lineModeEnabled ? 'active' : ''}`}
                    onClick={handleEnterLineMode}
                  >
                    选行
                  </button>
                </div>

                {lineModeEnabled && selectedLines.size > 0 && (
                  <div className="line-nav">
                    <button className="line-nav-btn" onClick={handlePrevLine}>
                      上一行
                    </button>
                    <span className="line-indicator">
                      {selectedLines.size} 行 | {([...selectedLines].sort((a,b) => a-b)[0] || 0) + 1} - {([...selectedLines].sort((a,b) => a-b).pop() || 0) + 1}
                    </span>
                    <button className="line-nav-btn" onClick={handleNextLine}>
                      下一行
                    </button>
                  </div>
                )}

                <div className="text-display">
                  {lineModeEnabled ? (
                    showMasked ? (
                      renderLineMasked(textLines, selectedLines, originalText, tokens, maskedIndices, revealedIndices, revealToken)
                    ) : (
                      renderSelectableLines(textLines, selectedLines, handleLineToggle)
                    )
                  ) : (
                    renderText(originalText, tokens, maskedIndices, revealedIndices, revealToken)
                  )}
                </div>
                <div className="study-actions">
                  <button className="edit-btn" onClick={handleEdit}>
                    编辑
                  </button>
                </div>
              </>
            )}
          </div>
        ) : page === 'paste' ? (
          <div className="paste-area">
            <textarea
              ref={textareaRef}
              className="paste-input"
              placeholder="在此粘贴要背诵的内容..."
            />
            <div className="paste-actions">
              <button className="save-btn" onClick={handleSaveDoc}>
                保存并开始背诵
              </button>
              <button className="save-btn secondary" onClick={handleSaveAndContinue}>
                仅保存
              </button>
              <button className="cancel-btn" onClick={() => setPage('study')}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="documents-area">
            <h2 className="docs-title">我的文档</h2>
            <div className="docs-list">
              {documents.length === 0 ? (
                <div className="docs-empty">
                  <p>还没有文档</p>
                  <button className="go-paste-btn" onClick={() => setPage('paste')}>
                    创建新文档
                  </button>
                </div>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`doc-card ${doc.id === currentDocId ? 'active' : ''}`}
                  >
                    <div className="doc-info" onClick={() => {
                      selectDocument(doc.id)
                      setPage('study')
                      setLineModeEnabled(false)
                      setSelectedLines(new Set())
                      setShowMasked(false)
                      setTimeout(() => applyMask(percentage), 50)
                    }}>
                      <h3 className="doc-name">
                        {doc.name}
                        {doc.isMarkdown && <span className="md-badge">MD</span>}
                      </h3>
                      <p className="doc-preview">{doc.content.slice(0, 50)}...</p>
                      <span className="doc-date">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="doc-delete"
                      onClick={() => handleDelete(doc.id)}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// 可选择的行列表（多选）
function renderSelectableLines(textLines, selectedLines, onToggle) {
  return (
    <div className="line-select">
      <div className="line-selection-hint">
        点击行以选择/取消选择，选中后点击"开始背诵"
      </div>
      {textLines.map((line, index) => (
        <div
          key={index}
          className={`line-item ${selectedLines.has(index) ? 'selected' : ''}`}
          onClick={() => onToggle(index)}
        >
          <span className="line-checkbox">{selectedLines.has(index) ? '✓' : ''}</span>
          <span className="line-number">{index + 1}</span>
          <span className="line-content">{line || '\u00A0'}</span>
        </div>
      ))}
    </div>
  )
}

// 渲染选中行的掩码内容
function renderLineMasked(textLines, selectedLines, fullText, tokens, maskedIndices, revealedIndices, onReveal) {
  return (
    <div className="line-masked-display">
      {textLines.map((line, index) => {
        if (selectedLines.has(index)) {
          // 计算这一行在全文中的位置
          let lineStart = 0
          for (let i = 0; i < index; i++) {
            lineStart += textLines[i].length + 1
          }
          const lineEnd = lineStart + line.length

          // 找出这一行的 tokens
          const lineTokenIndices = []
          tokens.forEach((token, tokenIdx) => {
            if (token.start >= lineStart && token.end <= lineEnd) {
              lineTokenIndices.push(tokenIdx)
            }
          })

          return (
            <div key={index} className="line-item masked-line">
              <span className="line-number">{index + 1}</span>
              <span className="line-mask-content">
                {renderLineTokens(line, lineTokenIndices, tokens, maskedIndices, revealedIndices, onReveal)}
              </span>
            </div>
          )
        }
        return (
          <div key={index} className="line-item muted">
            <span className="line-number">{index + 1}</span>
            <span className="line-text muted">{line || '\u00A0'}</span>
          </div>
        )
      })}
    </div>
  )
}

// 渲染一行中的 tokens
function renderLineTokens(line, lineTokenIndices, tokens, maskedIndices, revealedIndices, onReveal) {
  const elements = []
  let lastPos = 0

  lineTokenIndices.forEach((tokenIdx) => {
    const token = tokens[tokenIdx]
    const pos = token.start
    // pos 需要相对于当前行重新计算
    const relPos = pos

    if (pos > lastPos) {
      elements.push(
        <span key={`pre-${tokenIdx}`}>{line.slice(lastPos, pos)}</span>
      )
    }

    const isMasked = maskedIndices.has(tokenIdx)
    const isRevealed = revealedIndices.has(tokenIdx)

    if (isMasked && !isRevealed) {
      elements.push(
        <span
          key={`mask-${tokenIdx}`}
          className="masked-text"
          onClick={() => onReveal(tokenIdx)}
        >
          {token.text}
        </span>
      )
    } else {
      elements.push(
        <span key={`text-${tokenIdx}`}>{token.text}</span>
      )
    }

    lastPos = pos + token.text.length
  })

  if (lastPos < line.length) {
    elements.push(
      <span key="post">{line.slice(lastPos)}</span>
    )
  }

  return elements
}

// 普通文本渲染（带掩码）
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

export default App
