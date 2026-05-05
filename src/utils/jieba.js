import init, { cut } from 'jieba-wasm'

let jiebaReady = false
let jiebaInitPromise = null

export async function initJieba() {
  if (jiebaReady) return true
  if (jiebaInitPromise) return jiebaInitPromise

  jiebaInitPromise = init()
    .then(() => {
      jiebaReady = true
      return true
    })
    .catch(err => {
      console.error('Failed to init jieba:', err)
      return false
    })

  return jiebaInitPromise
}

export function tokenizeText(text) {
  if (!text.trim()) return []

  const tokens = []
  const words = cut(text, true) // precise mode

  let pos = 0
  for (const word of words) {
    const start = text.indexOf(word, pos)
    if (start === -1) {
      pos += word.length
      continue
    }
    tokens.push({
      id: tokens.length,
      text: word,
      start: start,
      end: start + word.length
    })
    pos = start + word.length
  }

  // Fallback if jieba didn't work
  if (tokens.length === 0) {
    return [{ id: 0, text: text.trim(), start: 0, end: text.length }]
  }

  return tokens
}