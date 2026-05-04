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