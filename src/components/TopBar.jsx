export default function TopBar({ view, onView, hidden }) {
  return (
    <div className={`top${view === 'wall' ? ' wall-mode' : ''}${hidden ? ' hidden' : ''}`}>
      <div className="brand"><span>ADHD</span> veidai</div>
      <div className="viewtabs">
        <button
          type="button"
          className={view === 'ring' ? 'active' : ''}
          onClick={() => onView('ring')}
        >
          Istorijos
        </button>
        <button
          type="button"
          className={view === 'wall' ? 'active' : ''}
          onClick={() => onView('wall')}
        >
          Visi veidai
        </button>
      </div>
    </div>
  );
}
