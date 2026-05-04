# Text Masker 实现计划

**Goal:** 构建一个 React 文字掩盖工具，用于背书场景

**Architecture:** 单页 React 应用，Vite 构建，组件化结构，轻量状态管理

**Tech Stack:** React 18, Vite, CSS

**User Verification:** NO — 无需用户验证

---

## Task 0: 初始化项目

**Goal:** 创建 React + Vite 项目结构

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles/index.css`

**Acceptance Criteria:**
- [ ] `npm install` 成功
- [ ] `npm run dev` 可启动开发服务器
- [ ] 页面可访问并显示基础内容

**Verify:** `npm run dev` → Vite dev server 启动

**Steps:**

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "text-masker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
```

- [ ] **Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Text Masker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 创建 src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 5: 创建 src/App.jsx（基础占位）**

```jsx
function App() {
  return <div>Text Masker</div>
}

export default App
```

- [ ] **Step 6: 创建 src/styles/index.css（基础样式）**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #eee;
  min-height: 100vh;
}
```

- [ ] **Step 7: 安装依赖并验证**

```bash
cd /home/charles/text_masker
npm install
npm run dev
```

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "chore: initialize Vite React project"
```

---

## Task 1: 创建 useMasker Hook

**Goal:** 实现核心掩盖逻辑

**Files:**
- Create: `src/hooks/useMasker.js`

**Acceptance Criteria:**
- [ ] 将文本按句子/标点分割成片段
- [ ] 根据百分比随机选择要掩盖的片段
- [ ] 每次调用返回不同的随机结果
- [ ] 支持点击揭示功能

**Verify:** 单元测试验证随机性和一致性

**Steps:**

- [ ] **Step 1: 创建 src/hooks/useMasker.js**

```jsx
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
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useMasker.js
git commit -m "feat: add useMasker hook with random masking logic"
```

---

## Task 2: 创建 InputArea 组件

**Goal:** 可折叠的文本输入区域

**Files:**
- Create: `src/components/InputArea.jsx`
- Modify: `src/styles/index.css`

**Acceptance Criteria:**
- [ ] 显示 textarea 用于粘贴文字
- [ ] 右上角有折叠按钮
- [ ] 折叠后隐藏 textarea
- [ ] 展开后可编辑

**Verify:** 点击折叠按钮可切换显示/隐藏

**Steps:**

- [ ] **Step 1: 创建 src/components/InputArea.jsx**

```jsx
import { useState } from 'react'

function InputArea({ onTextChange, value }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleChange = (e) => {
    onTextChange(e.target.value)
  }

  if (isCollapsed) {
    return (
      <div className="input-area collapsed">
        <div className="input-header">
          <span className="input-hint">输入区域已折叠</span>
          <button
            className="collapse-btn"
            onClick={() => setIsCollapsed(false)}
            title="展开"
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="input-area">
      <div className="input-header">
        <span>粘贴文字</span>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(true)}
          title="折叠"
        >
          −
        </button>
      </div>
      <textarea
        className="text-input"
        placeholder="在此粘贴要记忆的文字..."
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

export default InputArea
```

- [ ] **Step 2: 添加 InputArea 样式到 index.css**

```css
/* InputArea styles */
.input-area {
  background: #16213e;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.input-area.collapsed {
  padding: 12px 16px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #8892b0;
  font-size: 14px;
}

.collapse-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #0f3460;
  color: #eee;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.collapse-btn:hover {
  background: #e94560;
}

.text-input {
  width: 100%;
  min-height: 120px;
  background: #0f0f23;
  border: 1px solid #233554;
  border-radius: 8px;
  padding: 12px;
  color: #eee;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
}

.text-input:focus {
  outline: none;
  border-color: #e94560;
}

.text-input::placeholder {
  color: #4a5568;
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/InputArea.jsx src/styles/index.css
git commit -m "feat: add collapsible InputArea component"
```

---

## Task 3: 创建 ControlBar 组件

**Goal:** 百分比选择按钮组和 Mask 按钮

**Files:**
- Create: `src/components/ControlBar.jsx`

**Acceptance Criteria:**
- [ ] 显示 25%、50%、75%、100% 四个按钮
- [ ] 当前选中的百分比有高亮样式
- [ ] Mask 按钮在右侧
- [ ] 按钮可点击触发对应功能

**Verify:** 点击按钮可切换选中状态，Mask 按钮触发掩盖

**Steps:**

- [ ] **Step 1: 创建 src/components/ControlBar.jsx**

```jsx
function ControlBar({ percentage, onPercentageChange, onMask, hasText }) {
  const percentages = [25, 50, 75, 100]

  return (
    <div className="control-bar">
      <div className="percentage-group">
        <span className="percentage-label">掩盖比例</span>
        <div className="percentage-buttons">
          {percentages.map((p) => (
            <button
              key={p}
              className={`percentage-btn ${percentage === p ? 'active' : ''}`}
              onClick={() => onPercentageChange(p)}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
      <button
        className="mask-btn"
        onClick={onMask}
        disabled={!hasText}
        title={hasText ? '随机掩盖文字' : '请先输入文字'}
      >
        🔀 Mask
      </button>
    </div>
  )
}

export default ControlBar
```

- [ ] **Step 2: 添加 ControlBar 样式**

```css
/* ControlBar styles */
.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #16213e;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.percentage-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.percentage-label {
  color: #8892b0;
  font-size: 14px;
}

.percentage-buttons {
  display: flex;
  gap: 8px;
}

.percentage-btn {
  padding: 8px 16px;
  border: 2px solid #233554;
  background: transparent;
  color: #8892b0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.percentage-btn:hover {
  border-color: #e94560;
  color: #eee;
}

.percentage-btn.active {
  background: #e94560;
  border-color: #e94560;
  color: #fff;
}

.mask-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  border: none;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.mask-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
}

.mask-btn:active:not(:disabled) {
  transform: translateY(0);
}

.mask-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/ControlBar.jsx src/styles/index.css
git commit -m "feat: add ControlBar with percentage buttons and Mask button"
```

---

## Task 4: 创建 MaskedTextDisplay 组件

**Goal:** 显示掩盖后的文字，支持点击揭示

**Files:**
- Create: `src/components/MaskedTextDisplay.jsx`

**Acceptance Criteria:**
- [ ] 显示所有文本片段
- [ ] 被掩盖的片段显示为深色块
- [ ] 点击掩盖块可显示原文（2秒后恢复）
- [ ] 揭示时使用不同背景色

**Verify:** 点击掩盖块可短暂显示原文

**Steps:**

- [ ] **Step 1: 创建 src/components/MaskedTextDisplay.jsx**

```jsx
function MaskedTextDisplay({
  segments,
  maskedIndices,
  revealedIndex,
  onReveal
}) {
  if (segments.length === 0) {
    return (
      <div className="masked-display empty">
        <p className="empty-hint">粘贴文字后点击 Mask 按钮开始学习</p>
      </div>
    )
  }

  return (
    <div className="masked-display">
      {segments.map((segment, index) => {
        const isMasked = maskedIndices.has(index)
        const isRevealed = revealedIndex === index

        if (isMasked && !isRevealed) {
          return (
            <span
              key={index}
              className="masked-block"
              onClick={() => onReveal(index)}
              title="点击查看"
            >
              ████
            </span>
          )
        }

        if (isRevealed) {
          return (
            <span
              key={index}
              className="revealed-block"
              onClick={() => onReveal(index)}
            >
              {segment}
            </span>
          )
        }

        return (
          <span key={index} className="normal-text">
            {segment}
          </span>
        )
      })}
    </div>
  )
}

export default MaskedTextDisplay
```

- [ ] **Step 2: 添加 MaskedTextDisplay 样式**

```css
/* MaskedTextDisplay styles */
.masked-display {
  background: #0f0f23;
  border-radius: 12px;
  padding: 24px;
  min-height: 300px;
  line-height: 2;
  font-size: 17px;
}

.masked-display.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-hint {
  color: #4a5568;
  font-size: 16px;
}

.normal-text {
  color: #eee;
}

.masked-block {
  display: inline-block;
  background: #333;
  color: #666;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  margin: 0 2px;
}

.masked-block:hover {
  background: #444;
}

.revealed-block {
  display: inline;
  background: rgba(233, 69, 96, 0.3);
  color: #ff6b6b;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/MaskedTextDisplay.jsx src/styles/index.css
git commit -m "feat: add MaskedTextDisplay with click-to-reveal"
```

---

## Task 5: 整合 App 组件

**Goal:** 将所有组件组合在一起，完成功能

**Files:**
- Modify: `src/App.jsx`

**Acceptance Criteria:**
- [ ] InputArea 可输入并折叠
- [ ] ControlBar 可切换百分比和触发 Mask
- [ ] MaskedTextDisplay 显示正确
- [ ] useMasker hook 连接所有逻辑
- [ ] 整体布局美观

**Verify:** 完整流程可运行

**Steps:**

- [ ] **Step 1: 更新 src/App.jsx**

```jsx
import { useState } from 'react'
import InputArea from './components/InputArea'
import ControlBar from './components/ControlBar'
import MaskedTextDisplay from './components/MaskedTextDisplay'
import { useMasker } from './hooks/useMasker'

function App() {
  const [percentage, setPercentage] = useState(50)
  const {
    originalText,
    segments,
    maskedIndices,
    revealedIndex,
    setText,
    applyMask,
    revealSegment
  } = useMasker()

  const handleMask = () => {
    applyMask(percentage)
  }

  const hasText = originalText.trim().length > 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Text Masker</h1>
        <p className="app-subtitle">文字背书工具</p>
      </header>

      <main className="app-main">
        <InputArea
          value={originalText}
          onTextChange={setText}
        />

        <ControlBar
          percentage={percentage}
          onPercentageChange={setPercentage}
          onMask={handleMask}
          hasText={hasText}
        />

        <MaskedTextDisplay
          segments={segments}
          maskedIndices={maskedIndices}
          revealedIndex={revealedIndex}
          onReveal={revealSegment}
        />
      </main>
    </div>
  )
}

export default App
```

- [ ] **Step 2: 添加 App 布局样式**

```css
/* App layout styles */
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 28px;
  color: #eee;
  margin-bottom: 8px;
}

.app-subtitle {
  color: #8892b0;
  font-size: 14px;
}

.app-main {
  display: flex;
  flex-direction: column;
}

/* Responsive */
@media (max-width: 600px) {
  .app {
    padding: 12px;
  }

  .control-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .percentage-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .percentage-buttons {
    width: 100%;
  }

  .percentage-btn {
    flex: 1;
    text-align: center;
  }

  .mask-btn {
    width: 100%;
    margin-top: 8px;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/App.jsx src/styles/index.css
git commit -m "feat: integrate all components in App"
```

---

## Task 6: 最终检查与优化

**Goal:** 确保所有功能正常工作，样式美观

**Acceptance Criteria:**
- [ ] 无 console 错误
- [ ] 所有按钮可点击
- [ ] 掩盖效果正确显示
- [ ] 点击揭示功能正常
- [ ] 移动端正常显示

**Verify:** 手动测试完整流程

**Steps:**

- [ ] **Step 1: 运行开发服务器并测试**

```bash
npm run dev
# 在浏览器中测试:
# 1. 粘贴一段文字
# 2. 选择 50% 百分比
# 3. 点击 Mask 按钮
# 4. 检查随机掩盖效果
# 5. 点击掩盖块验证揭示功能
```

- [ ] **Step 2: 检查并修复问题**

确保以下功能正常：
- 输入区域可折叠/展开
- 百分比按钮正确高亮
- Mask 按钮禁用状态正确（无文字时禁用）
- 掩盖块的视觉效果清晰
- 揭示后 2 秒自动恢复

- [ ] **Step 3: 提交最终版本**

```bash
git add -A
git commit -m "feat: complete text masker with all features"
```