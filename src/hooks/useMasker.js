import { useState, useCallback, useEffect, useMemo } from 'react'
import { initJieba, tokenizeText as jiebaTokenize } from '../utils/jieba'

const STORAGE_KEY = 'text-masker-documents'
const STATE_KEY = 'text-masker-state'

// Safe localStorage access (SSR safe)
const getStorageItem = (key, fallback = null) => {
  try {
    if (typeof window === 'undefined') return fallback
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function isMarkdown(text) {
  const lines = text.split('\n')
  let score = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^#{1,6}\s/.test(trimmed)) score += 2
    if (/^[-*+]\s/.test(trimmed)) score += 1
    if (/^\d+\.\s/.test(trimmed)) score += 1
    if (/^>\s/.test(trimmed)) score += 1
    if (/^```/.test(trimmed)) score += 2
    if (/\*\*[^*]+\*\*/.test(trimmed)) score += 1
    if (/(?<!\*)\*[^*]+\*(?!\*)/.test(trimmed)) score += 1
    if (/`[^`]+`/.test(trimmed)) score += 1
    if (/\[.+\]\(.+\)/.test(trimmed)) score += 1
    if (/^[-*_]{3,}$/.test(trimmed)) score += 1
    if (/^\|.+\|$/.test(trimmed)) score += 2
  }

  return score >= 3 || /```/.test(text)
}

export function useMasker() {
  const [documents, setDocuments] = useState(() => getStorageItem(STORAGE_KEY, []))

  const [currentDocId, setCurrentDocId] = useState(() => {
    const state = getStorageItem(STATE_KEY, {})
    return state.currentDocId ?? null
  })

  // Persistent folder handle for sync
  const [folderHandle, setFolderHandle] = useState(null)

  const [tokens, setTokens] = useState([])
  const [maskedIndices, setMaskedIndices] = useState(() => {
    const state = getStorageItem(STATE_KEY, {})
    return new Set(state.maskedIndices ?? [])
  })
  const [revealedIndices, setRevealedIndices] = useState(new Set())
  const [markdownDetected, setMarkdownDetected] = useState(false)

  // UI state - restored from localStorage on mount
  const [lineModeEnabled, setLineModeEnabled] = useState(() => {
    const state = getStorageItem(STATE_KEY, {})
    return state.lineModeEnabled ?? false
  })
  const [selectedLines, setSelectedLines] = useState(() => {
    const state = getStorageItem(STATE_KEY, {})
    return new Set(state.selectedLines ?? [])
  })
  const [showMasked, setShowMasked] = useState(() => {
    const state = getStorageItem(STATE_KEY, {})
    return state.showMasked ?? false
  })

  const currentDoc = documents.find(d => d.id === currentDocId)
  const originalText = currentDoc?.content || ''

  const saveToStorage = useCallback((docs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [])

  const createDocument = useCallback((content, name = null) => {
    const markdownDetected = isMarkdown(content)
    const newDoc = {
      id: Date.now().toString(),
      name: name || `文档 ${documents.length + 1}`,
      content,
      isMarkdown: markdownDetected,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const newDocs = [...documents, newDoc]
    setDocuments(newDocs)
    setCurrentDocId(newDoc.id)
    setTokens(jiebaTokenize(content))
    setMaskedIndices(new Set())
    setRevealedIndices(new Set())
    setMarkdownDetected(markdownDetected)
    // Reset UI state for new document
    setLineModeEnabled(false)
    setSelectedLines(new Set())
    setShowMasked(false)
    saveToStorage(newDocs)
    return newDoc.id
  }, [documents, saveToStorage])

  const updateDocument = useCallback((id, content) => {
    const newDocs = documents.map(d => {
      if (d.id === id) {
        return { ...d, content, updatedAt: new Date().toISOString() }
      }
      return d
    })
    setDocuments(newDocs)
    if (id === currentDocId) {
      setTokens(jiebaTokenize(content))
      setMaskedIndices(new Set())
      setRevealedIndices(new Set())
      setMarkdownDetected(isMarkdown(content))
    }
    saveToStorage(newDocs)
  }, [documents, currentDocId, saveToStorage])

  const deleteDocument = useCallback((id) => {
    const newDocs = documents.filter(d => d.id !== id)
    setDocuments(newDocs)
    if (currentDocId === id) {
      const remaining = newDocs[0]
      if (remaining) {
        setCurrentDocId(remaining.id)
        setTokens(jiebaTokenize(remaining.content))
        setMaskedIndices(new Set())
        setRevealedIndices(new Set())
        setMarkdownDetected(remaining.isMarkdown ?? isMarkdown(remaining.content))
      } else {
        setCurrentDocId(null)
        setTokens([])
        setMaskedIndices(new Set())
        setRevealedIndices(new Set())
        setMarkdownDetected(false)
      }
    }
    saveToStorage(newDocs)
  }, [documents, currentDocId, saveToStorage])

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

  const selectDocument = useCallback((id) => {
    const doc = documents.find(d => d.id === id)
    if (doc) {
      setCurrentDocId(id)
      setTokens(jiebaTokenize(doc.content))
      setMaskedIndices(new Set())
      setRevealedIndices(new Set())
      setMarkdownDetected(doc.isMarkdown ?? isMarkdown(doc.content))
    }
  }, [documents])

  const applyMask = useCallback((percentage) => {
    if (tokens.length === 0) return

    // Filter out space tokens - we don't want to mask spaces
    const maskableTokens = tokens.filter(t => !/^\s+$/.test(t.text))
    if (maskableTokens.length === 0) return

    const totalCount = maskableTokens.length
    const maskCount = Math.round(totalCount * (percentage / 100))
    const availableIndices = maskableTokens.map(t => t.id)
    const shuffled = availableIndices.sort(() => Math.random() - 0.5)
    const selectedToMask = new Set(shuffled.slice(0, maskCount))

    // Convert back to original token indices
    const newMaskedIndices = new Set(
      tokens
        .map((t, i) => ({ id: t.id, idx: i }))
        .filter(t => selectedToMask.has(t.id))
        .map(t => t.idx)
    )
    setMaskedIndices(newMaskedIndices)
    setRevealedIndices(new Set())
  }, [tokens])

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

  const clearMask = useCallback(() => {
    setMaskedIndices(new Set())
    setRevealedIndices(new Set())
  }, [])

  // Export all data to JSON file (single file for simple export)
  const exportData = useCallback(() => {
    const data = {
      documents,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-masker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [documents])

  // Import data from JSON file
  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (!data.documents || !Array.isArray(data.documents)) {
            reject(new Error('Invalid file format'))
            return
          }
          // Merge with existing documents (skip duplicates by id)
          setDocuments(prev => {
            const existingIds = new Set(prev.map(d => d.id))
            const newDocs = data.documents.filter(d => !existingIds.has(d.id))
            return [...prev, ...newDocs]
          })
          resolve({ added: data.documents.length })
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  // Pick and store folder handle
  const pickFolder = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('您的浏览器不支持选择文件夹功能。请使用 Chrome/Edge 浏览器。')
      return
    }
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setFolderHandle(dirHandle)
      return { success: true }
    } catch (err) {
      if (err.name !== 'AbortError') {
        throw err
      }
      return { cancelled: true }
    }
  }, [])

  // Save to stored folder handle
  const saveToFolder = useCallback(async () => {
    if (!folderHandle) {
      return { noFolder: true }
    }
    try {
      // Save each document as a separate file
      const manifest = { documents: [], updatedAt: new Date().toISOString() }

      for (const doc of documents) {
        const fileName = `doc-${doc.id}.json`
        const fileHandle = await folderHandle.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(JSON.stringify(doc, null, 2))
        await writable.close()

        manifest.documents.push({
          id: doc.id,
          name: doc.name,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        })
      }

      // Save manifest
      const manifestHandle = await folderHandle.getFileHandle('manifest.json', { create: true })
      const manifestWritable = await manifestHandle.createWritable()
      await manifestWritable.write(JSON.stringify(manifest, null, 2))
      await manifestWritable.close()

      return { success: true, count: documents.length }
    } catch (err) {
      throw err
    }
  }, [folderHandle, documents])

  // Load from stored folder handle
  const loadFromFolder = useCallback(async () => {
    if (!folderHandle) {
      return { noFolder: true }
    }
    try {
      let mergedCount = 0

      for await (const entry of folderHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('doc-') && entry.name.endsWith('.json')) {
          try {
            const file = await entry.getFile()
            const content = await file.text()
            const doc = JSON.parse(content)

            setDocuments(prev => {
              const existingIds = new Set(prev.map(d => d.id))
              if (!existingIds.has(doc.id)) {
                mergedCount++
                return [...prev, doc]
              }
              return prev
            })
          } catch (e) {
            console.warn(`Failed to load ${entry.name}:`, e)
          }
        }
      }

      return { success: true, mergedCount }
    } catch (err) {
      throw err
    }
  }, [folderHandle])

  // 行级掩码
  const applyLineMask = useCallback((lineIndex, percentage, text) => {
    const lines = text.split('\n')
    if (lineIndex < 0 || lineIndex >= lines.length) return

    const targetLine = lines[lineIndex]
    const lineTokens = tokens.filter(t => {
      const startInLine = t.start >= (lineIndex === 0 ? 0 : text.indexOf(lines[lineIndex], text.indexOf(lines[lineIndex - 1]) + lines[lineIndex - 1].length + 1))
      return startInLine
    })

    if (lineTokens.length === 0) return

    const totalCount = lineTokens.length
    const maskCount = Math.round(totalCount * (percentage / 100))
    const indices = lineTokens.map(t => tokens.indexOf(t))
    const shuffled = [...indices].sort(() => Math.random() - 0.5)
    const toMask = new Set(shuffled.slice(0, maskCount))

    setMaskedIndices(toMask)
    setRevealedIndices(new Set())
  }, [tokens])

  // 多行掩码
  const applyMultiLineMask = useCallback((lineIndices, percentage, text) => {
    const lines = text.split('\n')
    if (lineIndices.size === 0) return

    const lineStartPositions = []
    let pos = 0
    for (let i = 0; i < lines.length; i++) {
      lineStartPositions.push(pos)
      pos += lines[i].length + 1 // +1 for newline (except last line)
    }

    const allLineTokens = []

    lines.forEach((line, lineIdx) => {
      if (lineIndices.has(lineIdx)) {
        const lineStart = lineStartPositions[lineIdx]
        const lineEnd = lineStart + line.length

        const lineTokens = tokens.filter(t =>
          t.start >= lineStart && t.end <= lineEnd && !/^\s+$/.test(t.text)
        )
        allLineTokens.push(...lineTokens.map(t => tokens.indexOf(t)))
      }
    })

    if (allLineTokens.length === 0) return

    const totalCount = allLineTokens.length
    const maskCount = Math.round(totalCount * (percentage / 100))
    const shuffled = [...allLineTokens].sort(() => Math.random() - 0.5)
    const toMask = new Set(shuffled.slice(0, maskCount))

    setMaskedIndices(toMask)
    setRevealedIndices(new Set())
  }, [tokens])

  // Save UI state to localStorage
  useEffect(() => {
    const state = {
      lineModeEnabled,
      selectedLines: [...selectedLines],
      showMasked,
      currentDocId,
      maskedIndices: [...maskedIndices]
    }
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save state:', e)
    }
  }, [lineModeEnabled, selectedLines, showMasked, currentDocId, maskedIndices])

  // Restore UI state and document state when document changes
  useEffect(() => {
    if (!currentDocId) return
    try {
      const saved = localStorage.getItem(STATE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        // Only restore if this was the same document
        if (state.currentDocId === currentDocId) {
          setLineModeEnabled(state.lineModeEnabled ?? false)
          setSelectedLines(new Set(state.selectedLines ?? []))
          setShowMasked(state.showMasked ?? false)
        } else {
          // Different document - reset to default
          setLineModeEnabled(false)
          setSelectedLines(new Set())
          setShowMasked(false)
        }
      }
    } catch {
      // ignore
    }
  }, [currentDocId])

  // Restore tokens when currentDocId changes
  useEffect(() => {
    if (currentDocId && currentDoc) {
      setTokens(jiebaTokenize(currentDoc.content))
      setMarkdownDetected(currentDoc.isMarkdown ?? isMarkdown(currentDoc.content))
    }
  }, [currentDocId])

  return {
    documents,
    currentDocId,
    currentDoc,
    originalText,
    tokens,
    maskedIndices,
    revealedIndices,
    markdownDetected,
    lineModeEnabled,
    setLineModeEnabled,
    selectedLines,
    setSelectedLines,
    showMasked,
    setShowMasked,
    createDocument,
    updateDocument,
    deleteDocument,
    renameDocument,
    selectDocument,
    applyMask,
    applyMultiLineMask,
    revealToken,
    clearMask,
    exportData,
    importData,
    saveToFolder,
    loadFromFolder,
    pickFolder
  }
}
