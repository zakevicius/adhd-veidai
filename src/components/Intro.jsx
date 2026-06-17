import { useEffect, useState } from 'react';

export default function Intro({ gone, onEnter, loading = false }) {
  // Italianno is a script font whose glyphs (the dot of the "i", trailing
  // swashes) overhang their box. The `rise` transform composites .intro-inner
  // into a GPU layer that gets rasterised once; if that happens before the
  // webfont settles, the overhanging ink is clipped and never repainted
  // (notably on mobile, until a resize). Gate the animation on fonts being
  // ready so the layer is rasterised with the real font in place.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const done = () => alive && setFontsReady(true);
    if (document.fonts?.ready) document.fonts.ready.then(done);
    else done();
    return () => { alive = false; };
  }, []);

  return (
    <div className={`intro${gone ? ' gone' : ''}`}>
      <div className={`intro-inner${fontsReady ? ' ready' : ''}`}>
        <h1><span>ADHD</span> veidai</h1>
        <div className="kicker">Portretų galerija</div>
        <p>
          Trumpos, asmeniškos žmonių, gyvenančių su ADHD, istorijos.
        </p>
        <button className="enter" type="button" onClick={onEnter} disabled={loading}>
          {loading ? (
            <><i className="spinner" aria-hidden="true" /> Kraunama…</>
          ) : (
            <>Įeiti į galeriją <span>&#8594;</span></>
          )}
        </button>
      </div>
    </div>
  );
}
