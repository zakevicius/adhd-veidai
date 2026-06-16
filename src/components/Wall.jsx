import { useEffect, useMemo, useRef } from 'react';
import Photo from './Photo';

// only even spans so tiles tessellate with no gaps (2x2 acts as filler)
const SIZES = [[2,2],[2,2],[2,2],[2,4],[4,2],[2,2],[4,4],[2,2],[2,4],[4,2],[2,2],[2,2]];

function randomSizes(count) {
  return Array.from({ length: count }, () => SIZES[Math.floor(Math.random() * SIZES.length)]);
}

export default function Wall({ people, show, onTile }) {
  const masonryRef = useRef(null);

  // assign a random tile size to each person once
  const tileSizes = useMemo(() => randomSizes(people.length), [people.length]);

  // size the grid so base cells are square, and apply each tile's span
  useEffect(() => {
    function layout() {
      const m = masonryRef.current;
      if (!m) return;
      const w = m.clientWidth;
      if (!w) return;
      const cols = innerWidth <= 620 ? 4 : innerWidth <= 980 ? 8 : 12;
      const gap = 10;
      const unit = (w - (cols - 1) * gap) / cols;
      m.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      m.style.gridAutoRows = unit + 'px';
      [...m.children].forEach((t) => {
        t.style.gridColumn = `span ${Math.min(+t.dataset.c, cols)}`;
        t.style.gridRow = `span ${t.dataset.r}`;
      });
    }
    layout();
    if (show && masonryRef.current) {
      const wall = masonryRef.current.closest('.wall');
      if (wall) wall.scrollTop = 0;
    }
    addEventListener('resize', layout);
    return () => removeEventListener('resize', layout);
  }, [tileSizes, show]);

  return (
    <div className={`wall${show ? ' show' : ''}`}>
      <div className="wall-inner">
        <p className="wall-lead">
          Visi veidai &mdash; spustelėkite bet kurį, kad perskaitytumėte istoriją.
        </p>
        <div className="masonry" ref={masonryRef}>
          {people.map((p, i) => (
            <div
              key={i}
              className="tile"
              data-c={tileSizes[i][0]}
              data-r={tileSizes[i][1]}
              onClick={() => onTile(i)}
            >
              <Photo person={p} size={600} />
              <div className="tnm"><b>{p.n}</b><small>{p.a}</small></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
