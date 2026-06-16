import { useCallback, useEffect, useRef, useState } from 'react';
import { shuffle } from './data/people';
import { loadPeople } from './lib/people';
import Intro from './components/Intro';
import TopBar from './components/TopBar';
import Deck from './components/Deck';
import Wall from './components/Wall';
import Lightbox from './components/Lightbox';

export default function App() {
  // fetched from Supabase (with a bundled-seed fallback), then randomised once
  const [people, setPeople] = useState([]);
  const total = people.length;

  useEffect(() => {
    let alive = true;
    loadPeople().then((list) => {
      if (alive) setPeople(shuffle(list));
    });
    return () => { alive = false; };
  }, []);

  const [entered, setEntered] = useState(false);
  const [view, setView] = useState('deck');
  const [idx, setIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(null);
  const [hintsGone, setHintsGone] = useState(false);
  const [uiHidden, setUiHidden] = useState(false); // auto-hide the header for a full-screen view

  const trackRef = useRef(null);
  const hideTimer = useRef(null);

  // mirror latest state for window event listeners (kept in sync after each render)
  const stateRef = useRef({ entered, view, idx, isOpen, lbIdx, total });
  useEffect(() => {
    stateRef.current = { entered, view, idx, isOpen, lbIdx, total };
  });

  // ---- auto-hide chrome (header/progress/counter) for an immersive view ----
  // armHide only manages a timer (no synchronous setState); it checks conditions when it fires
  const armHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const s = stateRef.current;
      if (s.entered && s.view === 'deck' && s.lbIdx === null) setUiHidden(true);
    }, 2800);
  }, []);
  const showChrome = useCallback(() => {
    setUiHidden(false);
    armHide();
  }, [armHide]);

  const go = useCallback((n) => {
    setIdx((cur) => {
      const t = Math.max(0, Math.min(total - 1, n));
      if (t !== cur) setIsOpen(false);
      return t;
    });
    setHintsGone(true); // fade the swipe hints once the user changes person
  }, [total]);
  const openStory = useCallback(() => setIsOpen(true), []);
  const closeStory = useCallback(() => setIsOpen(false), []);

  const changeView = useCallback((v) => {
    setView(v);
    if (v === 'wall') setIsOpen(false);
    showChrome();
  }, [showChrome]);

  const openLB = useCallback((i) => setLbIdx(i), []);
  const closeLB = useCallback(() => setLbIdx(null), []);
  const lbJump = useCallback(() => {
    const i = stateRef.current.lbIdx;
    setLbIdx(null);
    setView('deck');
    go(i);
    showChrome();
    setTimeout(() => setIsOpen(true), 400);
  }, [go, showChrome]);

  const enterGallery = useCallback(() => {
    if (stateRef.current.entered) return;
    setEntered(true);
    setTimeout(() => setHintsGone(true), 7000);
    showChrome();
  }, [showChrome]);

  // returns the current slide's scrollable story element
  const currentStory = useCallback(
    () => trackRef.current?.children?.[stateRef.current.idx]?.querySelector('.story'),
    []
  );

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e) => {
      const s = stateRef.current;
      if (e.key === 'Escape') {
        if (s.lbIdx !== null) closeLB();
        else closeStory();
        return;
      }
      if (!s.entered || s.view !== 'deck') return;
      if (e.key === 'ArrowRight') go(s.idx + 1);
      else if (e.key === 'ArrowLeft') go(s.idx - 1);
      else if (e.key === 'ArrowUp') openStory();
      else if (e.key === 'ArrowDown') closeStory();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go, openStory, closeStory, closeLB]);

  // ---- wheel / trackpad: horizontal = change person, vertical = reveal/close ----
  useEffect(() => {
    let wlock = false;
    const onWheel = (e) => {
      const s = stateRef.current;
      if (!s.entered || s.view !== 'deck') return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      // suppress the browser's two-finger back/forward swipe while in the deck
      if (horizontal && e.cancelable) e.preventDefault();
      if (wlock) return;
      if (horizontal) {
        if (Math.abs(e.deltaX) < 18) return;
        wlock = true;
        setTimeout(() => (wlock = false), 550);
        if (e.deltaX > 0) go(s.idx + 1); else go(s.idx - 1);
      } else {
        const story = currentStory();
        if (s.isOpen && story && story.scrollTop > 0) return; // let the story scroll
        if (Math.abs(e.deltaY) < 12) return;
        wlock = true;
        setTimeout(() => (wlock = false), 550);
        if (e.deltaY < 0) openStory(); else closeStory();
      }
    };
    addEventListener('wheel', onWheel, { passive: false });
    return () => removeEventListener('wheel', onWheel);
  }, [go, openStory, closeStory, currentStory]);

  // ---- pointer drag: mouse AND touch ----
  useEffect(() => {
    const deck = trackRef.current?.parentElement;
    if (!deck) return;
    let down = false, sx = 0, sy = 0;
    const onDown = (e) => { down = true; sx = e.clientX; sy = e.clientY; };
    const onUp = (e) => {
      if (!down) return;
      down = false;
      const s = stateRef.current;
      if (s.view !== 'deck') return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax < 40 && ay < 40) { showChrome(); return; } // a tap reveals the chrome
      if (ax > ay) {
        if (dx < 0) go(s.idx + 1); else go(s.idx - 1);
      } else {
        const story = currentStory();
        if (dy < 0) openStory();
        else if (!s.isOpen || !story || story.scrollTop <= 0) closeStory();
      }
    };
    const onCancel = () => { down = false; };
    deck.addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onCancel);
    return () => {
      deck.removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onCancel);
    };
  }, [go, openStory, closeStory, currentStory, showChrome]);

  // reveal the chrome on genuine mouse movement (desktop hover) — never on swipe/scroll/keys
  useEffect(() => {
    const onMove = (e) => {
      if (e.pointerType === 'mouse' && e.buttons === 0) showChrome();
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [showChrome]);

  return (
    <>
      <TopBar view={view} onView={changeView} hidden={uiHidden && view === 'deck' && lbIdx === null} />
      {entered && view === 'deck' && (
        <div className="counter"><b>{idx + 1}</b> / <span>{total}</span></div>
      )}

      <Wall people={people} show={view === 'wall'} onTile={openLB} />

      <Deck
        ref={trackRef}
        people={people}
        idx={idx}
        isOpen={isOpen}
        onPrev={() => go(idx - 1)}
        onNext={() => go(idx + 1)}
        onCloseStory={closeStory}
      />

      <Lightbox
        person={lbIdx !== null ? people[lbIdx] : null}
        onClose={closeLB}
        onJump={lbJump}
      />

      <div className={`ghint side left${hintsGone ? ' gone' : ''}`}>&#8249;</div>
      <div className={`ghint side right${hintsGone ? ' gone' : ''}`}>&#8250;</div>
      <div className={`ghint label${hintsGone ? ' gone' : ''}`}>
        &#8249; braukite į šonus, kad pamatytumėte kitus &#8250;
      </div>

      <Intro entered={entered} onEnter={enterGallery} />
    </>
  );
}
