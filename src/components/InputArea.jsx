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