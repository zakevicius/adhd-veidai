export default function Intro({ entered, onEnter }) {
  return (
    <div className={`intro${entered ? ' gone' : ''}`}>
      <div className="intro-inner">
        <h1><span>ADHD</span> veidai</h1>
        <div className="kicker">Portretų galerija</div>
        <p>
          Trumpos, asmeniškos žmonių, gyvenančių su ADHD, istorijos &mdash; po
          vieną veidą, po vieną balsą.
        </p>
        <button className="enter" type="button" onClick={onEnter}>
          Įeiti į galeriją <span>&#8594;</span>
        </button>
      </div>
    </div>
  );
}
