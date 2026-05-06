import init, { cut } from 'jieba-wasm'

let jiebaReady = false
let jiebaInitPromise = null

// ASCII printable characters (33-126), excluding alphanumeric
// This includes: ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { | } ~
// Plus common Chinese punctuation
const PUNCT_REGEX = /[\u0021-\u007E\u3002\uFF0C\uFF01\uFF1F\uFF1B\uFF1A]/

export function isPunctuation(text) {
  // Must be punctuation/symbol and not contain letters, digits, or Chinese characters
  return PUNCT_REGEX.test(text) && !/[A-Za-z0-9\u4e00-\u9fa5]/.test(text)
}

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
      jiebaReady = false
      return false
    })

  return jiebaInitPromise
}

// Synchronous tokenization with graceful fallback if jieba isn't ready
export function tokenizeText(text) {
  if (!text.trim()) return []

  // Fallback: simple character-based tokenization
  const fallbackTokenize = () => {
    const tokens = []
    let currentWord = ''
    let wordStart = 0

    const isPunct = (char) => PUNCT_REGEX.test(char) && !/[A-Za-z0-9\u4e00-\u9fa5]/.test(char)

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const isChinese = char >= '\u4e00' && char <= '\u9fa5'
      const isPunctuation = isPunct(char)
      const isWhitespace = /\s/.test(char)

      let charType = 'other'
      if (isChinese) charType = 'chinese'
      else if (isPunctuation) charType = 'punct'
      else if (isWhitespace) charType = 'space'

      // Punctuation and whitespace become separate tokens
      if (isPunctuation || isWhitespace) {
        if (currentWord) {
          tokens.push({ id: tokens.length, text: currentWord, start: wordStart, end: i })
          currentWord = ''
        }
        tokens.push({ id: tokens.length, text: char, start: i, end: i + 1 })
      } else {
        // Non-punctuation character
        if (currentWord && charType !== 'other') {
          // Check if previous char was Chinese and current is other (Latin, number)
          // or previous was other and current is Chinese - need to separate
          const prevLast = currentWord.slice(-1)
          const prevIsChinese = prevLast >= '\u4e00' && prevLast <= '\u9fa5'
          if (prevIsChinese !== (charType === 'chinese')) {
            // Script type changed, create token and start new word
            tokens.push({ id: tokens.length, text: currentWord, start: wordStart, end: i })
            currentWord = ''
          }
        }
        if (!currentWord) {
          wordStart = i
        }
        currentWord += char
      }
    }

    if (currentWord) {
      tokens.push({ id: tokens.length, text: currentWord, start: wordStart, end: text.length })
    }

    return tokens
  }

  // If jieba isn't ready, use fallback
  if (!jiebaReady) {
    console.warn('Jieba not ready, using fallback tokenizer')
    return fallbackTokenize()
  }

  try {
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

    // Fallback if jieba didn't produce results
    if (tokens.length === 0) {
      return fallbackTokenize()
    }

    return tokens
  } catch (err) {
    console.error('Jieba tokenization failed:', err)
    return fallbackTokenize()
  }
}