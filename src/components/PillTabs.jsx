import './PillTabs.css'

function PillTabs({ tabs, selected, onSelect }) {
  return (
    <div className="pill-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`pill-tab ${selected === tab.value ? 'selected' : ''}`}
          onClick={() => onSelect(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default PillTabs


