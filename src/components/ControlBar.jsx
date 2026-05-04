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