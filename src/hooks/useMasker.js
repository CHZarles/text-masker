import { useState, useCallback } from 'react'

/**
 * 将文本分割成片段（按句子或段落）
 */
function splitIntoSegments(text) {
  if (!text.trim()) return []

  // 按句子分割（。！？.!?）
  const sentences = text.split(/(?<=[。！？.!?])/)

  // 如果句子太少，按逗号和换行再分割
  if (sentences.length < 3) {
    return text.split(/[,，\n]+/).filter(s => s.trim())
  }

  return sentences.filter(s => s.trim())
}

/**
 * 根据百分比随机选择片段进行掩盖
 */
export function useMasker() {
  const [originalText, setOriginalText] = useState('')
  const [segments, setSegments] = useState([])
  const [maskedIndices, setMaskedIndices] = useState(new Set())
  const [revealedIndex, setRevealedIndex] = useState(null)

  /**
   * 设置原始文本并分割
   */
  const setText = useCallback((text) => {
    setOriginalText(text)
    setSegments(splitIntoSegments(text))
    setMaskedIndices(new Set())
    setRevealedIndex(null)
  }, [])

  /**
   * 根据百分比随机掩盖
   */
  const applyMask = useCallback((percentage) => {
    if (segments.length === 0) return

    const totalCount = segments.length
    const maskCount = Math.round(totalCount * (percentage / 100))

    // 随机选择要掩盖的索引
    const availableIndices = [...Array(totalCount).keys()]
    const shuffled = availableIndices.sort(() => Math.random() - 0.5)
    const newMaskedIndices = new Set(shuffled.slice(0, maskCount))

    setMaskedIndices(newMaskedIndices)
    setRevealedIndex(null)
  }, [segments])

  /**
   * 点击揭示片段
   */
  const revealSegment = useCallback((index) => {
    setRevealedIndex(index)
    // 2秒后自动恢复掩盖
    setTimeout(() => {
      setRevealedIndex(null)
    }, 2000)
  }, [])

  /**
   * 清除所有掩盖
   */
  const clearMask = useCallback(() => {
    setMaskedIndices(new Set())
    setRevealedIndex(null)
  }, [])

  return {
    originalText,
    segments,
    maskedIndices,
    revealedIndex,
    setText,
    applyMask,
    revealSegment,
    clearMask
  }
}