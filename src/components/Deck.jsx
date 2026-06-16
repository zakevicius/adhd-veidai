import { forwardRef } from 'react';
import Photo from './Photo';

const Deck = forwardRef(function Deck(
  { people, idx, isOpen, onPrev, onNext, onCloseStory },
  trackRef
) {
  return (
    <div className="deck">
      <div
        className="track"
        ref={trackRef}
        style={{ transform: `translateX(${-idx * 100}%)` }}
      >
        {people.map((p, i) => (
          <div key={i} className={`slide${i === idx && isOpen ? ' open' : ''}`}>
            <div className="photo">
              <Photo person={p} size={900} />
            </div>
            <div className="veil" />
            <div className="panel">
              <div className="kicker">ADHD veidai</div>
              <h2>{p.n}</h2>
              <div className="age">{p.a}</div>
              <div className="hint">
                <span className="chev">&#8593;</span> Braukite aukštyn, kad perskaitytumėte istoriją
              </div>
              <div className="story">
                {p.s.map((t, k) => <p key={k}>{t}</p>)}
                <button className="close" type="button" onClick={onCloseStory}>
                  Uždaryti
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className={`nav prev${idx === 0 ? ' hide' : ''}`}
        type="button"
        aria-label="Ankstesnis"
        onClick={onPrev}
      >
        &#8249;
      </button>
      <button
        className={`nav next${idx === people.length - 1 ? ' hide' : ''}`}
        type="button"
        aria-label="Kitas"
        onClick={onNext}
      >
        &#8250;
      </button>
    </div>
  );
});

export default Deck;
