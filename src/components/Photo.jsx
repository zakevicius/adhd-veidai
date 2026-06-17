// Renders a portrait. Uses the local photo when present, otherwise a pravatar
// placeholder; if a local photo fails to load it falls back to the placeholder.
export default function Photo({ person, size, className = '' }) {
  const fallback = `https://i.pravatar.cc/${size}?img=${person.fb}`;
  const src = person.img ? person.img : fallback;

  function handleError(e) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallback;
  }

  return <img src={src} alt={person.n} className={className || undefined} onError={handleError} />;
}
