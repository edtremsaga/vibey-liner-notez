import './RowListItem.css'

function RowListItem({ image, primaryText, secondaryText, meta, onClick }) {
  return (
    <div 
      className="row-list-item"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {image && (
        <div className="row-list-item-image">
          <img src={image} alt={primaryText || ''} />
        </div>
      )}
      <div className="row-list-item-content">
        {primaryText && (
          <div className="row-list-item-primary">{primaryText}</div>
        )}
        {secondaryText && (
          <div className="row-list-item-secondary">{secondaryText}</div>
        )}
      </div>
      {meta && (
        <div className="row-list-item-meta">{meta}</div>
      )}
    </div>
  )
}

export default RowListItem

