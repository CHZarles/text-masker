import { useState, useRef, useEffect } from 'react'
import { useMasker } from './hooks/useMasker'
import { initJieba } from './utils/jieba'
import './styles/index.css'

// Check if content is markdown (for dynamic detection)
function checkMarkdown(content) {
  const patterns = [
    /^#{1,6}\s/m,
    /^\s*[-*+]\s/m,
    /^\s*\d+\.\s/m,
    /^\s*>\s/m,
    /```/,
    /\*\*[^*]+\*\*/,
    /__[^_]+__/,
    /(?<!\*)\*[^*]+\*(?!\*)/,
    /(?<!_)_[^_]+_(?!_)/,
    /`[^`]+`/,
    /\[.+\]\(.+\)/,
    /^\s*[-*_]{3,}\s*$/m,
    /\|.+\|/,
  ]
  return patterns.some(p => p.test(content))
}

function App() {
  const [page, setPage] = useState('study')
  const [percentage, setPercentage] = useState(50)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const textareaRef = useRef(null)

  // Initialize jieba on app load
  useEffect(() => {
    initJieba().then(ready => {
      if (ready) {
        console.log('Jieba initialized successfully')
      } else {
        console.warn('Jieba initialization failed, using fallback tokenizer')
      }
    }).catch(err => {
      console.error('Jieba init error:', err)
    })
  }, [])

  const {
    documents,
    currentDocId,
    currentDoc,
    originalText,
    tokens,
    maskedIndices,
    revealedIndices,
    createDocument,
    updateDocument,
    deleteDocument,
    renameDocument,
    selectDocument,
    applyMask,
    applyMultiLineMask,
    revealToken,
    lineModeEnabled,
    setLineModeEnabled,
    selectedLines,
    setSelectedLines,
    showMasked,
    setShowMasked,
    maskPunctuation,
    setMaskPunctuation,
    exportData,
    importData,
    saveToFolder,
    loadFromFolder,
    pickFolder
  } = useMasker()

  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef(null)

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
    if (showMasked) return // Don't allow selection changes when showing masked view
    setSelectedLines(prev => {
      const next = new Set(prev)
      if (next.has(lineIndex)) {
        next.delete(lineIndex)
      } else {
        next.add(lineIndex)
      }
      return next
    })
  }

  const handlePrevLine = () => {
    if (!showMasked) return
    const sorted = [...selectedLines].sort((a, b) => a - b)
    if (sorted.length > 0) {
      const first = sorted[0]
      if (first > 0) {
        const newSet = new Set([first - 1])
        setSelectedLines(newSet)
        applyMultiLineMask(newSet, percentage, originalText)
      }
    }
  }

  const handleNextLine = () => {
    if (!showMasked) return
    const sorted = [...selectedLines].sort((a, b) => a - b)
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1]
      if (last < textLines.length - 1) {
        const newSet = new Set([last + 1])
        setSelectedLines(newSet)
        applyMultiLineMask(newSet, percentage, originalText)
      }
    }
  }

  const handleExitLineMode = () => {
    setLineModeEnabled(false)
    setSelectedLines(new Set())
    setShowMasked(false)
    applyMask(percentage)
  }

  const handleBackToSelection = () => {
    setShowMasked(false)
  }

  const handleExport = () => {
    exportData()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importData(file)
      setImportMessage(`成功导入 ${result.added} 个文档`)
      setTimeout(() => setImportMessage(''), 3000)
    } catch (err) {
      setImportMessage(`导入失败: ${err.message}`)
      setTimeout(() => setImportMessage(''), 5000)
    }
    e.target.value = ''
  }

  const handleSaveToFolder = async () => {
    try {
      const result = await saveToFolder()
      if (result.success) {
        setImportMessage(`已上传 ${result.count} 个文档`)
        setTimeout(() => setImportMessage(''), 3000)
      } else if (result.noFolder) {
        setImportMessage('请先选择文件夹')
        setTimeout(() => setImportMessage(''), 2000)
      }
    } catch (err) {
      setImportMessage(`上传失败: ${err.message}`)
      setTimeout(() => setImportMessage(''), 5000)
    }
  }

  const handleLoadFromFolder = async () => {
    try {
      const result = await loadFromFolder()
      if (result.success) {
        setImportMessage(`从文件夹恢复了 ${result.mergedCount} 个文档`)
        setTimeout(() => setImportMessage(''), 3000)
      } else if (result.noFolder) {
        setImportMessage('请先选择文件夹')
        setTimeout(() => setImportMessage(''), 2000)
      }
    } catch (err) {
      setImportMessage(`加载失败: ${err.message}`)
      setTimeout(() => setImportMessage(''), 5000)
    }
  }

  const handlePickFolder = async () => {
    try {
      const result = await pickFolder()
      if (result.success) {
        setImportMessage('已选择同步文件夹')
        setTimeout(() => setImportMessage(''), 2000)
      }
    } catch (err) {
      if (err.message) {
        setImportMessage(`选择失败: ${err.message}`)
        setTimeout(() => setImportMessage(''), 5000)
      }
    }
  }

  const handleEnterLineMode = () => {
    setLineModeEnabled(true)
    setShowMasked(false)
    if (selectedLines.size === 0) {
      setSelectedLines(new Set([0]))
    }
  }

  const handleEdit = () => {
    setEditContent(originalText)
    setIsEditing(true)
  }

  const handleRename = () => {
    if (!currentDoc) return
    const newName = prompt('请输入新标题:', currentDoc.name)
    if (newName && newName.trim()) {
      renameDocument(currentDocId, newName.trim())
    }
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

  const handleRandomDoc = () => {
    if (documents.length < 2) return
    const otherDocs = documents.filter(d => d.id !== currentDocId)
    if (otherDocs.length === 0) return
    const randomDoc = otherDocs[Math.floor(Math.random() * otherDocs.length)]
    selectDocument(randomDoc.id)
    setPage('study')
    applyMask(percentage)
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
          <button
            className="nav-btn nav-btn-random"
            onClick={handleRandomDoc}
            disabled={documents.length < 2}
            title="随机切换文档"
          >
            随机
          </button>
          <button
            className={`nav-btn ${page === 'settings' ? 'active' : ''}`}
            onClick={() => setPage('settings')}
          >
            设置
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
            {showMasked ? '重置' : (lineModeEnabled ? '开始' : '练习')}
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

                {lineModeEnabled && (
                  <div className="line-nav">
                    {showMasked ? (
                      <>
                        <button className="line-nav-btn" onClick={handlePrevLine}>
                          上一行
                        </button>
                        <span className="line-indicator">
                          {([...selectedLines].sort((a,b) => a-b)[0] || 0) + 1} / {textLines.length}
                        </span>
                        <button className="line-nav-btn" onClick={handleNextLine}>
                          下一行
                        </button>
                        <button className="line-nav-btn exit" onClick={handleBackToSelection}>
                          返回选择
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="line-indicator">
                          已选 {selectedLines.size} 行
                        </span>
                        <button
                          className="line-nav-btn exit"
                          onClick={() => setSelectedLines(new Set())}
                        >
                          清空
                        </button>
                      </>
                    )}
                  </div>
                )}

                {currentDoc && !isEditing && (
                  <div className="doc-title-bar">
                    <span className="doc-title">{currentDoc.name}</span>
                    <button className="edit-title-btn" onClick={handleRename}>
                      重命名
                    </button>
                  </div>
                )}

                <div className="text-display">
                  {!lineModeEnabled ? (
                    renderText(originalText, tokens, maskedIndices, revealedIndices, revealToken)
                  ) : showMasked ? (
                    renderLineMasked(textLines, selectedLines, originalText, tokens, maskedIndices, revealedIndices, revealToken)
                  ) : (
                    renderSelectableLines(textLines, selectedLines, handleLineToggle)
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
        ) : page === 'settings' ? (
          <div className="settings-area">
            <h2 className="settings-title">设置</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">背诵选项</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={maskPunctuation}
                  onChange={(e) => setMaskPunctuation(e.target.checked)}
                />
                <span className="toggle-label">掩码标点符号</span>
              </label>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">文件同步</h3>
              <p className="settings-desc">使用浏览器原生文件夹同步功能，需要 Chrome/Edge 浏览器支持。</p>
              <div className="settings-actions">
                <button className="settings-btn" onClick={handlePickFolder}>
                  选择文件夹
                </button>
                <button className="settings-btn" onClick={handleSaveToFolder}>
                  下载到文件夹
                </button>
                <button className="settings-btn" onClick={handleLoadFromFolder}>
                  从文件夹上传
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">导入/导出</h3>
              <div className="settings-actions">
                <button className="settings-btn" onClick={handleExport}>
                  导出JSON
                </button>
                <button className="settings-btn" onClick={handleImportClick}>
                  导入JSON
                </button>
              </div>
            </div>

            {importMessage && (
              <div className="settings-message">{importMessage}</div>
            )}
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
                    }}>
                      <h3 className="doc-name">
                        {doc.name}
                        {(doc.isMarkdown || checkMarkdown(doc.content)) && <span className="md-badge">MD</span>}
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

// 渲染选中行的掩码内容（只显示选中的行）
function renderLineMasked(textLines, selectedLines, fullText, tokens, maskedIndices, revealedIndices, onReveal) {
  const sortedSelected = [...selectedLines].sort((a, b) => a - b)

  return (
    <div className="line-masked-display">
      {sortedSelected.map((lineIndex) => {
        const line = textLines[lineIndex]
        // 计算这一行在全文中的位置
        let lineStart = 0
        for (let i = 0; i < lineIndex; i++) {
          lineStart += textLines[i].length + 1
        }
        const lineEnd = lineStart + line.length

        // 找出这一行的 tokens
        const lineTokenIndices = []
        tokens.forEach((token, tokenIdx) => {
          if (token.start >= lineStart && token.end <= lineEnd) {
            lineTokenIndices.push({ tokenIdx, token })
          }
        })

        return (
          <div key={lineIndex} className="line-item masked-line">
            <span className="line-number">{lineIndex + 1}</span>
            <span className="line-mask-content">
              {renderLineTokens(line, lineTokenIndices, lineStart, maskedIndices, revealedIndices, onReveal)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// 渲染一行中的 tokens
function renderLineTokens(line, lineTokenIndices, lineStart, maskedIndices, revealedIndices, onReveal) {
  const elements = []
  let lastPos = 0

  lineTokenIndices.forEach(({ tokenIdx, token }) => {
    // 计算 token 在行内的相对位置
    const relPos = token.start - lineStart

    if (relPos > lastPos) {
      elements.push(
        <span key={`pre-${tokenIdx}`}>{line.slice(lastPos, relPos)}</span>
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

    lastPos = relPos + token.text.length
  })

  if (lastPos < line.length) {
    elements.push(
      <span key="post">{line.slice(lastPos)}</span>
    )
  }

  return elements
}

// Markdown parser - parses markdown into blocks for mask rendering
function parseMarkdown(content) {
  const lines = content.split('\n')
  const blocks = []
  let currentBlock = null
  let currentListItems = []
  let currentTable = null
  let inCodeBlock = false
  let codeBlockContent = []
  let codeBlockLang = ''

  const flushParagraph = () => {
    if (currentBlock) {
      blocks.push(currentBlock)
      currentBlock = null
    }
  }

  const flushList = () => {
    if (currentListItems.length > 0) {
      blocks.push({ type: 'list', items: [...currentListItems] })
      currentListItems = []
    }
  }

  const flushTable = () => {
    if (currentTable) {
      blocks.push(currentTable)
      currentTable = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', language: codeBlockLang, content: codeBlockContent.join('\n') })
        inCodeBlock = false
        codeBlockContent = []
        codeBlockLang = ''
      } else {
        flushParagraph()
        flushList()
        flushTable()
        inCodeBlock = true
        codeBlockLang = line.slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      flushTable()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2]
      })
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph()
      flushList()
      flushTable()
      blocks.push({ type: 'blockquote', text: line.slice(2) })
      continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      flushParagraph()
      flushList()
      flushTable()
      blocks.push({ type: 'hr' })
      continue
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      flushParagraph()
      flushList()
      // Check if this is a separator row
      if (/^\|[\s\-:|]+\|/.test(line)) {
        if (currentTable) {
          currentTable.hasSeparator = true
        }
        continue
      }

      if (!currentTable) {
        currentTable = { type: 'table', headers: [], rows: [], hasSeparator: false }
      }

      const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim())

      if (!currentTable.hasSeparator && currentTable.headers.length === 0) {
        currentTable.headers = cells
      } else if (currentTable.hasSeparator) {
        currentTable.rows.push(cells)
      }
      continue
    } else {
      flushTable()
    }

    // List items
    const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.+)$/)
    const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/)

    if (unorderedMatch) {
      flushParagraph()
      const indent = unorderedMatch[1].length
      const text = unorderedMatch[2]
      currentListItems.push({ indent, text, ordered: false })
      continue
    }

    if (orderedMatch) {
      flushParagraph()
      const indent = orderedMatch[1].length
      const text = orderedMatch[2]
      currentListItems.push({ indent, text, ordered: true })
      continue
    }

    // Empty line - end paragraph/list
    if (line.trim() === '') {
      flushParagraph()
      flushList()
      continue
    }

    // Paragraph content
    flushList()
    if (currentBlock) {
      currentBlock.text += '\n' + line
    } else {
      currentBlock = { type: 'paragraph', text: line }
    }
  }

  // Flush remaining
  flushParagraph()
  flushList()
  flushTable()

  return blocks
}

// Map text content to token indices for masking
function getTokenIndicesForText(text, fullText, tokens) {
  const startIdx = fullText.indexOf(text)
  if (startIdx === -1) return new Set()

  const endIdx = startIdx + text.length
  const indices = new Set()

  tokens.forEach((token, idx) => {
    if (token.start >= startIdx && token.end <= endIdx) {
      indices.add(idx)
    }
  })

  return indices
}

// Render masked inline text (handles bold, italic, code, links)
function renderInlineText(text, maskedIndices, revealedIndices, allTokens, fullText, onReveal) {
  // Simple inline parsing
  const parts = []
  let remaining = text
  let lastIdx = 0

  // Patterns for inline formatting
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
    { regex: /__([^_]+)__/g, type: 'bold' },
    { regex: /(?<!\*)\*([^*]+)\*(?!\*)/g, type: 'italic' },
    { regex: /(?<!_)_([^_]+)_(?!_)/g, type: 'italic' },
    { regex: /`([^`]+)`/g, type: 'code' },
    { regex: /\[([^\]]+)\]\([^)]+\)/g, type: 'link' },
  ]

  // For simplicity, just render the text with mask
  // Find tokens that fall within this text span
  const startIdx = fullText.indexOf(text)
  if (startIdx === -1) {
    return <span key={Math.random()}>{text}</span>
  }

  const endIdx = startIdx + text.length
  const elements = []
  let pos = 0
  const localText = text

  allTokens.forEach((token, idx) => {
    // Find token position in original text
    const tokenStartInFull = fullText.indexOf(token.text, startIdx)
    if (tokenStartInFull >= startIdx && tokenStartInFull < endIdx) {
      // This token is within our text
      const relStart = tokenStartInFull - startIdx

      if (relStart > pos) {
        elements.push(localText.slice(pos, relStart))
      }

      const isMasked = maskedIndices.has(idx)
      const isRevealed = revealedIndices.has(idx)

      if (isMasked && !isRevealed) {
        elements.push(
          <span key={idx} className="masked-text" onClick={() => onReveal(idx)}>
            {token.text}
          </span>
        )
      } else {
        elements.push(token.text)
      }

      pos = relStart + token.text.length
    }
  })

  if (pos < localText.length) {
    elements.push(localText.slice(pos))
  }

  return <span key={Math.random()}>{elements.length > 0 ? elements : text}</span>
}

// Render markdown blocks with mask support
function renderMarkdown(text, tokens, maskedIndices, revealedIndices, onReveal) {
  const blocks = parseMarkdown(text)

  return blocks.map((block, blockIdx) => {
    switch (block.type) {
      case 'heading':
        return (
          <div key={blockIdx} className={`md-heading md-h${block.level}`}>
            {renderInlineText(block.text, maskedIndices, revealedIndices, tokens, text, onReveal)}
          </div>
        )

      case 'paragraph':
        return (
          <div key={blockIdx} className="md-paragraph">
            {renderInlineText(block.text, maskedIndices, revealedIndices, tokens, text, onReveal)}
          </div>
        )

      case 'blockquote':
        return (
          <div key={blockIdx} className="md-blockquote">
            {renderInlineText(block.text, maskedIndices, revealedIndices, tokens, text, onReveal)}
          </div>
        )

      case 'hr':
        return <hr key={blockIdx} className="md-hr" />

      case 'list':
        const ListTag = block.items[0]?.ordered ? 'ol' : 'ul'
        return (
          <ListTag key={blockIdx} className="md-list">
            {block.items.map((item, i) => (
              <li key={i} className="md-list-item" style={{ marginLeft: item.indent * 16 }}>
                {renderInlineText(item.text, maskedIndices, revealedIndices, tokens, text, onReveal)}
              </li>
            ))}
          </ListTag>
        )

      case 'table':
        return (
          <div key={blockIdx} className="md-table-wrapper">
            <table className="md-table">
              <thead>
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>
                        {renderInlineText(cell, maskedIndices, revealedIndices, tokens, text, onReveal)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'code':
        return (
          <pre key={blockIdx} className="md-code-block">
            <code className={block.language ? `language-${block.language}` : ''}>
              {block.content}
            </code>
          </pre>
        )

      default:
        return null
    }
  })
}

// 普通文本渲染（带掩码）
function renderText(text, tokens, maskedIndices, revealedIndices, onReveal) {
  // Check if content is markdown
  if (checkMarkdown(text)) {
    return renderMarkdown(text, tokens, maskedIndices, revealedIndices, onReveal)
  }

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
