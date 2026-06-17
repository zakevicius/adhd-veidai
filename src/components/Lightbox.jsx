import { memo } from 'react';
import Photo from './Photo';

function Lightbox({ person, onClose, onJump }) {
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={`lb${person ? ' open' : ''}`} onClick={handleBackdrop}>
      <button className="lb-close" type="button" aria-label="Uždaryti" onClick={onClose}>
        &times;
      </button>
      {person && (
        <div className="lb-card">
          <div className="lb-img">
            <Photo person={person} size={700} />
          </div>
          <div className="lb-tx">
            <div className="kicker">ADHD veidai</div>
            <h3>{person.n}</h3>
            <div className="age">{person.a}</div>
            <div>{person.s.map((t, k) => <p key={k}>{t}</p>)}</div>
            <button className="lb-jump" type="button" onClick={onJump}>
              Atverti istorijose &#8594;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(Lightbox);
