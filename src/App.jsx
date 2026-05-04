import { useState, useRef } from 'react'
import { useMasker } from './hooks/useMasker'
import './styles/index.css'

function App() {
  const [page, setPage] = useState('study')
  const [percentage, setPercentage] = useState(50)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [lineMode, setLineMode] = useState(false)
  const [selectedLine, setSelectedLine] = useState(null)
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
    applyLineMask,
    revealToken
  } = useMasker()

  // 按行分割文本
  const textLines = originalText ? originalText.split('\n') : []

  const handleMask = () => {
    if (lineMode && selectedLine !== null) {
      // 行模式：重新掩码选中行
      applyLineMask(selectedLine, percentage, originalText)
    } else {
      applyMask(percentage)
    }
  }

  const handleLineSelect = (lineIndex) => {
    setSelectedLine(lineIndex)
    setLineMode(true)
    applyLineMask(lineIndex, percentage, originalText)
  }

  const handlePrevLine = () => {
    if (selectedLine > 0) {
      setSelectedLine(selectedLine - 1)
      applyLineMask(selectedLine - 1, percentage, originalText)
    }
  }

  const handleNextLine = () => {
    if (selectedLine < textLines.length - 1) {
      setSelectedLine(selectedLine + 1)
      applyLineMask(selectedLine + 1, percentage, originalText)
    }
  }

  const handleExitLineMode = () => {
    setLineMode(false)
    setSelectedLine(null)
    applyMask(percentage)
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

  const renderContent = () => {
    if (!originalText) return null
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
            disabled={!originalText.trim()}
          >
            {lineMode ? '重新开始' : '开始背诵'}
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
                {lineMode && (
                  <div className="line-nav">
                    <button className="line-nav-btn" onClick={handlePrevLine} disabled={selectedLine <= 0}>
                      上一行
                    </button>
                    <span className="line-indicator">{selectedLine + 1} / {textLines.length}</span>
                    <button className="line-nav-btn" onClick={handleNextLine} disabled={selectedLine >= textLines.length - 1}>
                      下一行
                    </button>
                    <button className="line-nav-btn exit" onClick={handleExitLineMode}>
                      退出选行
                    </button>
                  </div>
                )}
                <div className="text-display">
                  {lineMode ? (
                    renderLineMode(textLines, selectedLine, tokens, maskedIndices, revealedIndices, revealToken)
                  ) : (
                    renderSelectableLines(textLines, handleLineSelect)
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
                      setLineMode(false)
                      setSelectedLine(null)
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

// 可选择的行列表（用于选择要背诵的行）
function renderSelectableLines(textLines, onSelect) {
  return (
    <div className="line-select">
      {textLines.map((line, index) => (
        <div
          key={index}
          className="line-item"
          onClick={() => onSelect(index)}
        >
          <span className="line-number">{index + 1}</span>
          <span className="line-content">{line || '\u00A0'}</span>
        </div>
      ))}
    </div>
  )
}

// 行背诵模式
function renderLineMode(textLines, selectedLine, tokens, maskedIndices, revealedIndices, onReveal) {
  return (
    <div className="line-mode">
      {textLines.map((line, index) => {
        if (index === selectedLine) {
          // 渲染选中行（带掩码）
          return (
            <div key={index} className="line-item active">
              <span className="line-number">{index + 1}</span>
              <span className="line-text">
                {renderLineTokens(line, index, tokens, maskedIndices, revealedIndices, onReveal)}
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
function renderLineTokens(line, lineIndex, allTokens, maskedIndices, revealedIndices, onReveal) {
  const lineElements = []
  let lastEnd = 0

  // 计算这一行在全文中的起始位置
  const linesBefore = allTokens.length > 0 ? 0 : 0

  allTokens.forEach((token, idx) => {
    // 简化：直接在行内查找 tokens
    const tokenInLine = line.includes(token.text)
    if (!tokenInLine) return

    const pos = line.indexOf(token.text, lastEnd)
    if (pos === -1) return

    if (pos > lastEnd) {
      lineElements.push(
        <span key={`pre-${idx}`}>{line.slice(lastEnd, pos)}</span>
      )
    }

    const isMasked = maskedIndices.has(idx)
    const isRevealed = revealedIndices.has(idx)

    if (isMasked && !isRevealed) {
      lineElements.push(
        <span
          key={`mask-${idx}`}
          className="masked-text"
          onClick={() => onReveal(idx)}
        >
          {token.text}
        </span>
      )
    } else {
      lineElements.push(
        <span key={`text-${idx}`}>{token.text}</span>
      )
    }

    lastEnd = pos + token.text.length
  })

  if (lastEnd < line.length) {
    lineElements.push(
      <span key="post">{line.slice(lastEnd)}</span>
    )
  }

  return lineElements
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
