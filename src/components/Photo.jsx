// Renders a portrait. Uses the local photo when present, otherwise a sepia-toned
// pravatar placeholder. If a local photo fails to load, it falls back to the
// toned placeholder too (mirrors the original onerror behaviour).
export default function Photo({ person, size, brightnessClass = '' }) {
  const fallback = `https://i.pravatar.cc/${size}?img=${person.fb}`;
  const src = person.img ? person.img : fallback;
  const toned = person.img ? brightnessClass : `tone ${brightnessClass}`.trim();

  function handleError(e) {
    const img = e.currentTarget;
    img.onerror = null;
    if (!img.classList.contains('tone')) img.classList.add('tone');
    img.src = fallback;
  }

  return <img src={src} alt={person.n} className={toned} onError={handleError} />;
}
