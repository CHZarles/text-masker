import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'text-masker-documents'

function tokenizeText(text) {
  if (!text.trim()) return []

  const tokens = []
  const regex = /[\u4e00-\u9fa5]{1,4}|[a-zA-Z]+/g
  let match

  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      id: match.index,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }

  if (tokens.length === 0) {
    return [{ id: 0, text: text.trim(), start: 0, end: text.length }]
  }

  return tokens
}

function isMarkdown(text) {
  const markdownPatterns = [
    /^#{1,6}\s/m,
    /\*\*[^*]+\*\*/,
    /\*[^*]+\*/,
    /`[^`]+`/,
    /\[.+\]\(.+\)/,
    /^[-*]\s/m,
    /^>\s/m,
    /```/,
    /\|.+\|/,
  ]
  return markdownPatterns.some(pattern => pattern.test(text))
}

export function useMasker() {
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [currentDocId, setCurrentDocId] = useState(null)
  const [tokens, setTokens] = useState([])
  const [maskedIndices, setMaskedIndices] = useState(new Set())
  const [revealedIndices, setRevealedIndices] = useState(new Set())
  const [isMarkdown, setIsMarkdown] = useState(false)

  // 获取当前文档
  const currentDoc = documents.find(d => d.id === currentDocId)
  const originalText = currentDoc?.content || ''

  // 保存到 localStorage
  const saveToStorage = useCallback((docs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [])

  // 创建新文档
  const createDocument = useCallback((content, name = null) => {
    const newDoc = {
      id: Date.now().toString(),
      name: name || `文档 ${documents.length + 1}`,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const newDocs = [...documents, newDoc]
    setDocuments(newDocs)
    setCurrentDocId(newDoc.id)
    setTokens(tokenizeText(content))
    setMaskedIndices(new Set())
    setRevealedIndices(new Set())
    setIsMarkdown(isMarkdown(content))
    saveToStorage(newDocs)
    return newDoc.id
  }, [documents, saveToStorage])

  // 更新文档内容
  const updateDocument = useCallback((id, content) => {
    const newDocs = documents.map(d => {
      if (d.id === id) {
        return { ...d, content, updatedAt: new Date().toISOString() }
      }
      return d
    })
    setDocuments(newDocs)
    setTokens(tokenizeText(content))
    setMaskedIndices(new Set())
    setRevealedIndices(new Set())
    setIsMarkdown(isMarkdown(content))
    saveToStorage(newDocs)
  }, [documents, saveToStorage])

  // 删除文档
  const deleteDocument = useCallback((id) => {
    const newDocs = documents.filter(d => d.id !== id)
    setDocuments(newDocs)
    if (currentDocId === id) {
      const remaining = newDocs[0]
      if (remaining) {
        setCurrentDocId(remaining.id)
        setTokens(tokenizeText(remaining.content))
        setMaskedIndices(new Set())
        setRevealedIndices(new Set())
        setIsMarkdown(isMarkdown(remaining.content))
      } else {
        setCurrentDocId(null)
        setTokens([])
        setMaskedIndices(new Set())
        setRevealedIndices(new Set())
        setIsMarkdown(false)
      }
    }
    saveToStorage(newDocs)
  }, [documents, currentDocId, saveToStorage])

  // 重命名文档
  const renameDocument = useCallback((id, newName) => {
    const newDocs = documents.map(d => {
      if (d.id === id) {
        return { ...d, name: newName, updatedAt: new Date().toISOString() }
      }
      return d
    })
    setDocuments(newDocs)
    saveToStorage(newDocs)
  }, [documents, saveToStorage])

  // 切换文档
  const selectDocument = useCallback((id) => {
    const doc = documents.find(d => d.id === id)
    if (doc) {
      setCurrentDocId(id)
      setTokens(tokenizeText(doc.content))
      setMaskedIndices(new Set())
      setRevealedIndices(new Set())
      setIsMarkdown(isMarkdown(doc.content))
    }
  }, [documents])

  // 应用掩码
  const applyMask = useCallback((percentage) => {
    if (tokens.length === 0) return

    const totalCount = tokens.length
    const maskCount = Math.round(totalCount * (percentage / 100))

    const availableIndices = [...Array(totalCount).keys()]
    const shuffled = availableIndices.sort(() => Math.random() - 0.5)
    const newMaskedIndices = new Set(shuffled.slice(0, maskCount))

    setMaskedIndices(newMaskedIndices)
    setRevealedIndices(new Set())
  }, [tokens])

  // 揭示 token
  const revealToken = useCallback((index) => {
    setRevealedIndices(prev => {
      const next = new Set(prev)
      next.add(index)
      return next
    })

    setTimeout(() => {
      setRevealedIndices(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }, 3000)
  }, [])

  // 清除掩码
  const clearMask = useCallback(() => {
    setMaskedIndices(new Set())
    setRevealedIndices(new Set())
  }, [])

  return {
    documents,
    currentDocId,
    currentDoc,
    originalText,
    tokens,
    maskedIndices,
    revealedIndices,
    isMarkdown,
    createDocument,
    updateDocument,
    deleteDocument,
    renameDocument,
    selectDocument,
    applyMask,
    revealToken,
    clearMask
  }
}