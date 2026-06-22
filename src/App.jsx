import { useCallback, useEffect, useRef, useState } from 'react';
import { shuffle } from './data/people';
import { loadPeople } from './lib/people';
import Intro from './components/Intro';
import TopBar from './components/TopBar';
import Ring from './components/Ring';
import Deck from './components/Deck';
import Wall from './components/Wall';
import Lightbox from './components/Lightbox';

export default function App() {
  // fetched from Supabase (with a bundled-seed fallback), then randomised once
  const [people, setPeople] = useState([]);
  const total = people.length;

  // `ready` = people fetched and the first photo decoded. `pending` = the user
  // pressed enter but we're still waiting on `ready`; the spinner shows only
  // during that genuine wait (instant on a warm load), and the gallery reveals
  // once ready so it never appears to a blank frame.
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    loadPeople().then((list) => {
      if (alive) setPeople(shuffle(list));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!people.length) return;
    const first = people[0];
    const src = first.img || `https://i.pravatar.cc/900?img=${first.fb}`;
    let alive = true;
    const done = () => alive && setReady(true);
    const img = new Image();
    img.onload = done;
    img.onerror = done;
    img.src = src;
    return () => { alive = false; };
  }, [people]);

  const [entered, setEntered] = useState(false);
  const [introGone, setIntroGone] = useState(false); // fades the intro out
  const [view, setView] = useState('ring');          // 'ring' (Istorijos browse) | 'wall'
  const [idx, setIdx] = useState(0);                 // focused/active person (shared by ring + story)
  const [storyOpen, setStoryOpen] = useState(false); // full-screen story overlay (the deck)
  const [isOpen, setIsOpen] = useState(false);       // story text revealed within the overlay
  const [lbIdx, setLbIdx] = useState(null);          // wall lightbox
  const [hintsGone, setHintsGone] = useState(false);

  const trackRef = useRef(null);
  const dragRef = useRef(false); // a pointer gesture that was a drag (suppresses the trailing click)

  // mirror latest state for window event listeners
  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = { entered, view, idx, storyOpen, isOpen, lbIdx, total };
  });

  // ---- person navigation ----
  // story overlay: clamp to ends (unchanged deck behaviour)
  const go = useCallback((n) => {
    setIdx((cur) => {
      const t = Math.max(0, Math.min(total - 1, n));
      if (t !== cur) setIsOpen(false);
      return t;
    });
    setHintsGone(true); // fade the swipe hints once the user changes person
  }, [total]);
  const goPrev = useCallback(() => go(stateRef.current.idx - 1), [go]);
  const goNext = useCallback(() => go(stateRef.current.idx + 1), [go]);

  // ring: endless wrap-around
  const spin = useCallback((delta) => {
    setIdx((cur) => (total ? ((cur + delta) % total + total) % total : 0));
  }, [total]);

  const revealStory = useCallback(() => setIsOpen(true), []);
  const hideStory = useCallback(() => setIsOpen(false), []);

  // ---- open / close the story overlay ----
  const openStoryAt = useCallback((i) => {
    setIdx(i);
    setIsOpen(false);
    setStoryOpen(true);
    setHintsGone(false);
    setTimeout(() => setHintsGone(true), 6000);
  }, []);
  const closeOverlay = useCallback(() => {
    setStoryOpen(false);
    setIsOpen(false);
  }, []);

  // a ring card: front card opens the story, any other spins to the front.
  // a drag that ended on a card fires a trailing click — ignore it.
  const onRingCard = useCallback((i) => {
    if (dragRef.current) return;
    if (i === stateRef.current.idx) openStoryAt(i);
    else setIdx(i);
  }, [openStoryAt]);

  const changeView = useCallback((v) => {
    setView(v);
    setStoryOpen(false);
    setIsOpen(false);
  }, []);

  // ---- wall lightbox ----
  const openLB = useCallback((i) => setLbIdx(i), []);
  const closeLB = useCallback(() => setLbIdx(null), []);
  const lbJump = useCallback(() => {
    const i = stateRef.current.lbIdx;
    setLbIdx(null);
    setView('ring');
    openStoryAt(i);
    setTimeout(() => setIsOpen(true), 420);
  }, [openStoryAt]);

  const enterGallery = useCallback(() => {
    if (stateRef.current.entered) return;
    setPending(true); // reveal once the first photo is ready (see effect below)
  }, []);

  // reveal once the first photo is ready: activate the gallery behind the still-
  // opaque intro+spinner, let it paint a couple of frames, then fade the intro
  // out — so the gallery never reveals to a blank/hitching frame.
  useEffect(() => {
    if (!pending || !ready) return;
    setEntered(true);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setIntroGone(true);
        setPending(false);
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [pending, ready]);

  // returns the current slide's scrollable story element (story overlay only)
  const currentStory = useCallback(
    () => trackRef.current?.children?.[stateRef.current.idx]?.querySelector('.story'),
    []
  );

  // input mode for the active browse context
  const mode = useCallback(() => {
    const s = stateRef.current;
    if (s.storyOpen) return 'story';
    if (s.entered && s.view === 'ring') return 'ring';
    return null; // wall / intro: native behaviour
  }, []);

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e) => {
      const s = stateRef.current;
      if (e.key === 'Escape') {
        if (s.lbIdx !== null) closeLB();
        else if (s.storyOpen) closeOverlay();
        return;
      }
      if (!s.entered) return;
      if (s.storyOpen) {
        if (e.key === 'ArrowRight') go(s.idx + 1);
        else if (e.key === 'ArrowLeft') go(s.idx - 1);
        else if (e.key === 'ArrowUp') revealStory();
        else if (e.key === 'ArrowDown') hideStory();
      } else if (s.view === 'ring' && s.lbIdx === null) {
        if (e.key === 'ArrowRight') spin(1);
        else if (e.key === 'ArrowLeft') spin(-1);
        else if (e.key === 'Enter') openStoryAt(s.idx);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go, spin, revealStory, hideStory, openStoryAt, closeOverlay, closeLB]);

  // ---- wheel / trackpad ----
  useEffect(() => {
    let wlock = false;
    const onWheel = (e) => {
      const m = mode();
      if (!m) return;
      const s = stateRef.current;

      if (m === 'ring') {
        if (e.cancelable) e.preventDefault();
        if (wlock) return;
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(d) < 10) return;
        wlock = true;
        setTimeout(() => (wlock = false), 300);
        spin(d > 0 ? 1 : -1);
        return;
      }

      // story overlay (ported deck behaviour)
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (horizontal && e.cancelable) e.preventDefault(); // suppress two-finger back/forward
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
        if (e.deltaY < 0) revealStory(); else hideStory();
      }
    };
    addEventListener('wheel', onWheel, { passive: false });
    return () => removeEventListener('wheel', onWheel);
  }, [mode, spin, go, revealStory, hideStory, currentStory]);

  // ---- pointer drag (mouse + touch) ----
  useEffect(() => {
    let down = false, sx = 0, sy = 0;
    const onDown = (e) => { down = true; sx = e.clientX; sy = e.clientY; dragRef.current = false; };
    const onUp = (e) => {
      if (!down) return;
      down = false;
      const m = mode();
      if (!m) return;
      const s = stateRef.current;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      const isDrag = ax >= 40 || ay >= 40;
      dragRef.current = isDrag;

      if (m === 'ring') {
        if (!isDrag) return;            // tap → handled by the card's onClick
        if (ax > ay) {
          const steps = Math.max(1, Math.round(ax / 90));
          spin(dx < 0 ? steps : -steps);
        }
        return;
      }

      // story overlay
      if (!isDrag) return;
      if (ax > ay) {
        if (dx < 0) go(s.idx + 1); else go(s.idx - 1);
      } else {
        const story = currentStory();
        if (dy < 0) revealStory();
        else if (!s.isOpen || !story || story.scrollTop <= 0) hideStory();
      }
    };
    const onCancel = () => { down = false; };
    addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onCancel);
    return () => {
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onCancel);
    };
  }, [mode, spin, go, revealStory, hideStory, currentStory]);

  return (
    <>
      <TopBar view={view} onView={changeView} hidden={false} />

      {entered && view === 'ring' && (
        <Ring people={people} idx={idx} onCard={onRingCard} onSpin={spin} />
      )}

      <Wall people={people} show={view === 'wall'} onTile={openLB} />

      {storyOpen && (
        <div className="story-overlay">
          <Deck
            ref={trackRef}
            people={people}
            idx={idx}
            isOpen={isOpen}
            onPrev={goPrev}
            onNext={goNext}
            onCloseStory={hideStory}
          />

          <div className="counter"><b>{idx + 1}</b> / <span>{total}</span></div>

          <button
            className="story-close"
            type="button"
            aria-label="Uždaryti"
            onClick={closeOverlay}
          >
            &times;
          </button>

          <div className={`ghint side left${hintsGone ? ' gone' : ''}`}>&#8249;</div>
          <div className={`ghint side right${hintsGone ? ' gone' : ''}`}>&#8250;</div>
        </div>
      )}

      <Lightbox
        person={lbIdx !== null ? people[lbIdx] : null}
        onClose={closeLB}
        onJump={lbJump}
      />

      <Intro gone={introGone} onEnter={enterGallery} loading={pending} />
    </>
  );
}
