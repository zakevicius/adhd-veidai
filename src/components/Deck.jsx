import { forwardRef, memo, useEffect, useRef } from 'react';
import Photo from './Photo';

const Deck = forwardRef(function Deck(
  { people, idx, isOpen, onPrev, onNext, onCloseStory },
  trackRef
) {
  // Shared, heavily-blurred backdrop of the current photo (desktop only) — a
  // couple of stable layers that never churn, unlike a blurred copy per slide
  // (which forced a GPU layer each and flickered as they were evicted).
  // Two layers crossfade over the swipe duration so the blur arrives in step
  // with the sliding photo instead of snapping in early.
  const srcOf = (p) => (p ? p.img || `https://i.pravatar.cc/900?img=${p.fb}` : null);
  const curSrc = srcOf(people[idx]);
  const prevIdxRef = useRef(idx);
  const prevSrc = srcOf(people[prevIdxRef.current]);
  useEffect(() => { prevIdxRef.current = idx; });

  return (
    <div className="deck">
      {prevSrc && <div className="deckbg" style={{ backgroundImage: `url(${prevSrc})` }} />}
      {curSrc && (
        <div className="deckbg deckbg-cur" key={idx} style={{ backgroundImage: `url(${curSrc})` }} />
      )}
      <div
        className="track"
        ref={trackRef}
        style={{ transform: `translateX(${-idx * 100}%)` }}
      >
        {people.map((p, i) => (
          <div key={i} className={`slide${i === idx && isOpen ? ' open' : ''}`}>
            <div className="photo">
              <Photo person={p} size={900} className="pfg" />
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

// memoised so a parent re-render (e.g. the intro spinner toggling) doesn't
// re-run the whole slide list — keeps the click→spinner paint instant
export default memo(Deck);
