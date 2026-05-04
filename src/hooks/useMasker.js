import { useState, useCallback } from 'react'

/**
 * 将文本按字/词分割
 */
function tokenizeText(text) {
  if (!text.trim()) return []

  // 匹配中文词汇（2-4字）和英文单词
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

  // 如果没有匹配到词汇（如全是标点），返回整个文本作为一个token
  if (tokens.length === 0) {
    return [{ id: 0, text: text.trim(), start: 0, end: text.length }]
  }

  return tokens
}

/**
 * 检测是否为 Markdown 文本
 */
function isMarkdown(text) {
  const markdownPatterns = [
    /^#{1,6}\s/m,          // 标题
    /\*\*[^*]+\*\*/,        // 粗体
    /\*[^*]+\*/,           // 斜体
    /`[^`]+`/,             // 代码
    /\[.+\]\(.+\)/,        // 链接
    /^[-*]\s/m,            // 列表
    /^>\s/m,               // 引用
    /```/,                 // 代码块
    /\|.+\|/,              // 表格
  ]

  return markdownPatterns.some(pattern => pattern.test(text))
}

export function useMasker() {
  const [originalText, setOriginalText] = useState('')
  const [tokens, setTokens] = useState([])
  const [maskedIndices, setMaskedIndices] = useState(new Set())
  const [revealedIndices, setRevealedIndices] = useState(new Set())
  const [isMarkdown, setIsMarkdown] = useState(false)

  /**
   * 设置原始文本并分词
   */
  const setText = useCallback((text) => {
    setOriginalText(text)
    setTokens(tokenizeText(text))
    setMaskedIndices(new Set())
    setRevealedIndices(new Set())
    setIsMarkdown(isMarkdown(text))
  }, [])

  /**
   * 根据百分比随机掩盖
   */
  const applyMask = useCallback((percentage) => {
    if (tokens.length === 0) return

    const totalCount = tokens.length
    const maskCount = Math.round(totalCount * (percentage / 100))

    // 随机选择要掩盖的索引
    const availableIndices = [...Array(totalCount).keys()]
    const shuffled = availableIndices.sort(() => Math.random() - 0.5)
    const newMaskedIndices = new Set(shuffled.slice(0, maskCount))

    setMaskedIndices(newMaskedIndices)
    setRevealedIndices(new Set())
  }, [tokens])

  /**
   * 点击揭示token
   */
  const revealToken = useCallback((index) => {
    setRevealedIndices(prev => {
      const next = new Set(prev)
      next.add(index)
      return next
    })

    // 3秒后自动恢复掩盖
    setTimeout(() => {
      setRevealedIndices(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }, 3000)
  }, [])

  /**
   * 清除所有掩盖
   */
  const clearMask = useCallback(() => {
    setMaskedIndices(new Set())
    setRevealedIndices(new Set())
  }, [])

  return {
    originalText,
    tokens,
    maskedIndices,
    revealedIndices,
    isMarkdown,
    setText,
    applyMask,
    revealToken,
    clearMask
  }
}