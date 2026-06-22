import { memo, useEffect, useState } from 'react';
import Photo from './Photo';

// 3D ring carousel of portrait cards (flat / no tilt). Each card sits at
// `rotateY(offset * STEP) translateZ(R)`, where `offset` is the shortest-path
// signed distance from the focused index so the ring loops endlessly.
// Desktop uses a gentle step so a wide arc (~7 cards) faces the viewer, and the
// whole stage is scaled to the viewport so it fills the width; phones use a
// tighter step + a fixed shrink so only ~3 cards show.
const WINDOW = 8;       // only mount images for |offset| <= WINDOW
const FADE_START = 70;  // start fading once a card turns past this angle
const FADE_END = 96;    // fully gone (edge-on / back of ring) by here

// measured extents of the un-scaled desktop arc (STEP 22, R 560, perspective
// 1300): the outer (offset 3) card reaches ~675px from centre, and the front
// card stands ~505px tall. Used to scale the stage so it fills the viewport.
const OUTER_EDGE = 675;
const FRONT_H = 505;

// Same STEP + R on every device so the photo-to-photo spacing is identical;
// only the post-projection stage scale differs (it's uniform, so it preserves
// the spacing). Desktop fills the width (~7 cards); phones use a bigger fixed
// scale so the cards stay large and the outer ones simply run off-screen (~3).
const STEP = 22;
const R = 560;

const geometryFor = () => {
  const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 760px)').matches;
  if (!desktop) return { STEP, R, scale: 0.5 }; // phones: ~3 large cards
  const vw = window.innerWidth, vh = window.innerHeight;
  // fill ~94% of the width, but cap so the tall front card still fits the height
  const scale = Math.max(0.8, Math.min((0.47 * vw) / OUTER_EDGE, (0.86 * vh) / FRONT_H, 1.45));
  return { STEP, R, scale };
};

function useGeometry() {
  const [g, setG] = useState(geometryFor);
  useEffect(() => {
    const onResize = () => setG(geometryFor());
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, []);
  return g;
}

// shortest signed distance from `focus` to `i` on a ring of `n` (wrap-around)
function signedOffset(i, focus, n) {
  let d = ((i - focus) % n + n) % n; // 0..n-1
  if (d > n / 2) d -= n;             // fold to [-n/2, n/2)
  return d;
}

function Ring({ people, idx, onCard, onSpin }) {
  const n = people.length;
  const { STEP, R, scale } = useGeometry();

  return (
    <div className="ring-root">
      <div className="ring-stage" style={{ transform: `scale(${scale})` }}>
        <div className="ring-view">
          <div className="rring">
            {people.map((p, i) => {
              const offset = signedOffset(i, idx, n);
              const angle = offset * STEP;
              const aa = Math.abs(angle);
              const inWindow = Math.abs(offset) <= WINDOW;

              // fade cards as they turn edge-on; hidden ones drop out entirely
              let opacity = 1;
              if (aa > FADE_START) opacity = Math.max(0, 1 - (aa - FADE_START) / (FADE_END - FADE_START));
              const hidden = !inWindow || opacity <= 0.001;
              const focused = offset === 0;

              return (
                <button
                  key={i}
                  type="button"
                  className={`rcard${focused ? ' focused' : ''}`}
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(${R}px)`,
                    opacity: hidden ? 0 : opacity,
                    zIndex: 200 - Math.round(aa),
                    pointerEvents: hidden ? 'none' : 'auto',
                  }}
                  onClick={() => onCard(i)}
                  tabIndex={hidden ? -1 : 0}
                  aria-hidden={hidden || undefined}
                  aria-label={focused ? undefined : p.n}
                >
                  {inWindow && <Photo person={p} size={420} className="rcard-img" />}
                  <div className="rcard-veil" />
                  {focused && (
                    <div className="rcard-meta">
                      <h3>{p.n}</h3>
                      <div className="rcard-age">{p.a}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button className="ring-nav prev" type="button" aria-label="Ankstesnis" onClick={() => onSpin(-1)}>
        &#8249;
      </button>
      <button className="ring-nav next" type="button" aria-label="Kitas" onClick={() => onSpin(1)}>
        &#8250;
      </button>
    </div>
  );
}

export default memo(Ring);
