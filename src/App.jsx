import { useState, useRef } from 'react'
import { useMasker } from './hooks/useMasker'
import './styles/index.css'

function App() {
  const [page, setPage] = useState('study')
  const [percentage, setPercentage] = useState(50)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTranslation, setEditTranslation] = useState('')
  const textareaRef = useRef(null)
  const translationRef = useRef(null)

  const {
    documents,
    currentDocId,
    originalText,
    translationText,
    translationLines,
    tokens,
    maskedIndices,
    revealedIndices,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    applyMask,
    revealToken
  } = useMasker()

  const handleMask = () => {
    applyMask(percentage)
  }

  const handleEdit = () => {
    setEditContent(originalText)
    setEditTranslation(translationText)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (currentDocId && editContent.trim()) {
      updateDocument(currentDocId, editContent, editTranslation)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
    setEditTranslation('')
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除这个文档吗？')) {
      deleteDocument(id)
    }
  }

  const handleSaveDoc = () => {
    const text = textareaRef.current?.value || ''
    const translation = translationRef.current?.value || ''
    if (text.trim()) {
      createDocument(text, translation)
      setPage('study')
    } else {
      alert('请先输入内容')
    }
  }

  const handleSaveAndContinue = () => {
    const text = textareaRef.current?.value || ''
    const translation = translationRef.current?.value || ''
    if (text.trim()) {
      createDocument(text, translation)
      if (textareaRef.current) textareaRef.current.value = ''
      if (translationRef.current) translationRef.current.value = ''
    } else {
      alert('请先输入内容')
    }
  }

  const renderContent = () => {
    if (!originalText) return null
    return renderText(originalText, tokens, translationLines, maskedIndices, revealedIndices, revealToken)
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
            开始背诵
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
                  placeholder="原文..."
                />
                <textarea
                  className="edit-input translation-input"
                  value={editTranslation}
                  onChange={(e) => setEditTranslation(e.target.value)}
                  placeholder="翻译版本（按行对应原文）..."
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
                <div className="text-display">
                  {renderContent()}
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
            <textarea
              ref={translationRef}
              className="paste-input translation-input"
              placeholder="粘贴翻译版本（按行对应原文）..."
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
                      setTimeout(() => applyMask(percentage), 50)
                    }}>
                      <h3 className="doc-name">
                        {doc.name}
                        {doc.translation && <span className="translation-badge">翻译</span>}
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

// 渲染带翻译的文本
function renderText(text, tokens, translationLines, maskedIndices, revealedIndices, onReveal) {
  // 将原文按行分割
  const textLines = text.split('\n')

  return textLines.map((line, lineIndex) => {
    const lineElements = []
    const lineStart = textLines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? lineIndex : 0)
    const lineEnd = lineStart + line.length

    // 找到属于这一行的 tokens
    const lineTokens = tokens.filter(t => t.start >= lineStart && t.end <= lineEnd)

    if (lineTokens.length === 0) {
      // 无 token 的行，直接显示原文和翻译
      return (
        <div key={`line-${lineIndex}`} className="text-line">
          <span className="line-text">{line}</span>
          {translationLines[lineIndex] && (
            <span className="line-translation">{translationLines[lineIndex].text}</span>
          )}
        </div>
      )
    }

    // 构建行的元素
    let lastEnd = lineStart
    lineTokens.forEach((token, idx) => {
      const tokenIdx = tokens.indexOf(token)

      // 行内 token 前的文本
      if (token.start > lastEnd) {
        lineElements.push(
          <span key={`pre-${lineIndex}-${idx}`} className="line-text">
            {text.slice(lastEnd, token.start)}
          </span>
        )
      }

      const isMasked = maskedIndices.has(tokenIdx)
      const isRevealed = revealedIndices.has(tokenIdx)

      if (isMasked && !isRevealed) {
        lineElements.push(
          <span
            key={`mask-${lineIndex}-${idx}`}
            className="masked-text"
            onClick={() => onReveal(tokenIdx)}
          >
            {token.text}
          </span>
        )
      } else {
        lineElements.push(
          <span key={`text-${lineIndex}-${idx}`} className="line-text">
            {token.text}
          </span>
        )
      }

      lastEnd = token.end
    })

    // 行末剩余文本
    if (lastEnd < lineEnd) {
      lineElements.push(
        <span key={`post-${lineIndex}`} className="line-text">
          {text.slice(lastEnd, lineEnd)}
        </span>
      )
    }

    return (
      <div key={`line-${lineIndex}`} className="text-line">
        <span className="line-content">{lineElements}</span>
        {translationLines[lineIndex] && (
          <span className="line-translation">{translationLines[lineIndex].text}</span>
        )}
      </div>
    )
  })
}

export default App
