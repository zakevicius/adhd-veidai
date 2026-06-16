import { supabase, configured } from './supabase';
import { people as seed } from '../data/people';

// The gallery components expect this compact shape:
//   { n: name, a: role line, img: photo url|null, fb: pravatar id, s: [paragraphs] }
// A database row is mapped onto it here so the rest of the app stays unchanged.
// Compose the "29 · dizainerė" line from the separate age + profession columns,
// joining with " · " only when both are present. Falls back to the legacy
// single `role` column for any rows that predate the split.
function roleLine(row) {
  const parts = [row.age, row.profession].map((v) => (v || '').trim()).filter(Boolean);
  return parts.length ? parts.join(' · ') : (row.role || '');
}

function fromRow(row) {
  return {
    id: row.id,
    n: row.name,
    a: roleLine(row),
    img: row.photo_url || null,
    fb: row.fb ?? 1,
    s: Array.isArray(row.story) ? row.story : [],
  };
}

// Load the gallery. Reads from Supabase when configured; if that fails or the
// table is empty, falls back to the bundled seed so the site never goes blank.
export async function loadPeople() {
  if (!configured) return seed;
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return seed;
    return data.map(fromRow);
  } catch (err) {
    console.warn('Falling back to bundled people data:', err.message);
    return seed;
  }
}
