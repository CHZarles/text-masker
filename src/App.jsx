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
  const editTextareaRef = useRef(null)

  const {
    documents,
    currentDocId,
    originalText,
    translationText,
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
    return renderText(originalText, translationText, tokens, maskedIndices, revealedIndices, revealToken)
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
                  ref={editTextareaRef}
                  className="edit-input"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="原文..."
                />
                <textarea
                  className="edit-input translation-input"
                  value={editTranslation}
                  onChange={(e) => setEditTranslation(e.target.value)}
                  placeholder="翻译版本..."
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
              placeholder="粘贴翻译版本（可选）..."
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

// 渲染带翻译提示的文本
function renderText(text, translation, tokens, maskedIndices, revealedIndices, onReveal) {
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
    } else if (isMasked && isRevealed) {
      elements.push(
        <span key={`text-${index}`}>
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

  // 如果有翻译，在底部显示
  if (translation) {
    elements.push(
      <div key="translation-hint" className="translation-hint">
        <span className="translation-label">翻译提示：</span>
        <span className="translation-text">{translation}</span>
      </div>
    )
  }

  return elements
}

export default App
