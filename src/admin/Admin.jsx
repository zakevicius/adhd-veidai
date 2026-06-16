import { useEffect, useState, useCallback } from 'react';
import { supabase, configured } from '../lib/supabase';
import { uploadPhoto, deletePhoto } from '../lib/photos';
import { people as seed } from '../data/people';
import './admin.css';

// paragraphs <-> textarea (one blank line between paragraphs)
const storyToText = (s) => (Array.isArray(s) ? s.join('\n\n') : '');
const textToStory = (t) =>
  t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

// split a legacy "29 · dizainerė" line into [age, profession]
const splitRole = (text) => {
  const t = (text || '').trim();
  if (t.includes('·')) {
    const [a, ...rest] = t.split('·');
    return [a.trim(), rest.join('·').trim()];
  }
  return ['', t]; // no separator → treat the whole thing as profession
};

// compose the display line from the two columns (legacy `role` as fallback)
const roleDisplay = (row) =>
  [row.age, row.profession].map((v) => (v || '').trim()).filter(Boolean).join(' · ')
  || row.role || '';

export default function Admin() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <div className="admin login">
        <div className="login-card">
          <div className="banner error">
            Supabase nesukonfigūruotas. Patikrinkite <code>.env</code> failą
            (<code>VITE_SUPABASE_URL</code> ir raktą).
          </div>
        </div>
      </div>
    );
  }
  if (!ready) return <div className="admin" />;
  if (!session) return <Login />;
  return <Dashboard />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr('Neteisingas el. paštas arba slaptažodis.');
    setBusy(false);
  }

  return (
    <div className="admin login">
      <form className="login-card" onSubmit={submit}>
        <h1>ADHD <span>veidai</span></h1>
        {err && <div className="banner error">{err}</div>}
        <div className="field">
          <label>El. paštas</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </div>
        <div className="field">
          <label>Slaptažodis</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        <button className="btn btn-primary" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
          {busy ? 'Jungiamasi…' : 'Prisijungti'}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // row object, or {} for new, or null for list
  const [notice, setNotice] = useState(null);   // { kind, text }

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) setNotice({ kind: 'error', text: error.message });
    else setRows(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function importSeed() {
    if (!confirm(`Importuoti ${seed.length} įrašus iš pradinio sąrašo?`)) return;
    const payload = seed.map((p, i) => {
      const [age, profession] = splitRole(p.a);
      return {
        name: p.n, age, profession, story: p.s, photo_url: p.img || null,
        fb: p.fb ?? 1, sort_order: i,
      };
    });
    const { error } = await supabase.from('people').insert(payload);
    if (error) setNotice({ kind: 'error', text: error.message });
    else { setNotice({ kind: 'ok', text: 'Įrašai importuoti.' }); load(); }
  }

  async function remove(row) {
    if (!confirm(`Pašalinti „${row.name}“?`)) return;
    const { error } = await supabase.from('people').delete().eq('id', row.id);
    if (error) { setNotice({ kind: 'error', text: error.message }); return; }
    if (row.photo_url) deletePhoto(row.photo_url).catch(() => {});
    setNotice({ kind: 'ok', text: 'Pašalinta.' });
    load();
  }

  if (editing !== null) {
    return (
      <EntryForm
        row={editing}
        nextOrder={rows ? rows.length : 0}
        onDone={(msg) => { setEditing(null); if (msg) setNotice({ kind: 'ok', text: msg }); load(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="admin">
      <div className="admin-wrap">
        <div className="admin-top">
          <div>
            <h1>ADHD <span>veidai</span></h1>
            <div className="sub">{rows ? `${rows.length} įrašų` : 'Kraunama…'}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => setEditing({})}>+ Pridėti</button>
            <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Atsijungti</button>
          </div>
        </div>

        {notice && <div className={`banner ${notice.kind}`}>{notice.text}</div>}

        {rows && rows.length === 0 && (
          <div className="banner warn" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ flex: 1 }}>Sąrašas tuščias. Galite importuoti pradinius {seed.length} įrašus.</span>
            <button className="btn" onClick={importSeed}>Importuoti</button>
          </div>
        )}

        <div className="entry-list">
          {rows && rows.map((row) => (
            <div className="entry" key={row.id}>
              <div className="thumb">
                <img
                  src={row.photo_url || `https://i.pravatar.cc/120?img=${row.fb ?? 1}`}
                  alt={row.name}
                />
              </div>
              <div className="meta">
                <b>{row.name}</b>
                <span>{roleDisplay(row)}</span>
                <p>{storyToText(row.story).replace(/\n+/g, ' ')}</p>
              </div>
              <div className="actions">
                <button className="btn" onClick={() => setEditing(row)}>Redaguoti</button>
                <button className="btn btn-danger" onClick={() => remove(row)}>Šalinti</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EntryForm({ row, nextOrder, onDone, onCancel }) {
  const isNew = !row.id;
  // seed the two fields from the columns, or split a legacy `role` line
  const initial = (row.age || row.profession)
    ? [row.age || '', row.profession || '']
    : splitRole(row.role);
  const [name, setName] = useState(row.name || '');
  const [age, setAge] = useState(initial[0]);
  const [profession, setProfession] = useState(initial[1]);
  const [story, setStory] = useState(storyToText(row.story));
  const [photoUrl, setPhotoUrl] = useState(row.photo_url || null);
  const [preview, setPreview] = useState(row.photo_url || null);
  const [pickedFile, setPickedFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPickedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      let finalUrl = photoUrl;
      if (pickedFile) {
        finalUrl = await uploadPhoto(pickedFile);
        if (row.photo_url && row.photo_url !== finalUrl) {
          deletePhoto(row.photo_url).catch(() => {});
        }
      }
      const record = {
        name: name.trim(),
        age: age.trim(),
        profession: profession.trim(),
        role: null, // split fields are the source of truth now
        story: textToStory(story),
        photo_url: finalUrl || null,
      };
      if (isNew) {
        record.fb = Math.floor(Math.random() * 70) + 1; // placeholder id if no photo
        record.sort_order = nextOrder;
        const { error } = await supabase.from('people').insert(record);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('people').update(record).eq('id', row.id);
        if (error) throw error;
      }
      onDone(isNew ? 'Įrašas pridėtas.' : 'Pakeitimai išsaugoti.');
    } catch (e2) {
      setErr(e2.message || 'Nepavyko išsaugoti.');
      setBusy(false);
    }
  }

  return (
    <div className="admin">
      <div className="admin-wrap" style={{ maxWidth: 640 }}>
        <div className="admin-top">
          <h1>{isNew ? 'Naujas įrašas' : 'Redaguoti'}</h1>
          <button className="btn btn-ghost" onClick={onCancel}>← Atgal</button>
        </div>

        {err && <div className="banner error">{err}</div>}

        <form onSubmit={save}>
          <div className="field">
            <label>Nuotrauka</label>
            <div className="photo-pick">
              <div className={`preview${preview ? '' : ' empty'}`}>
                {preview ? <img src={preview} alt="" /> : <span>Nėra nuotraukos</span>}
              </div>
              <div>
                <label className="btn" style={{ cursor: 'pointer' }}>
                  {preview ? 'Pakeisti nuotrauką' : 'Įkelti nuotrauką'}
                  <input type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
                </label>
                {preview && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setPreview(null); setPhotoUrl(null); setPickedFile(null); }}
                    style={{ marginLeft: 8 }}
                  >
                    Pašalinti
                  </button>
                )}
                <div className="hint">Didelės nuotraukos automatiškai sumažinamos, kokybė išsaugoma.</div>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Vardas</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Amžius</label>
              <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="29" />
            </div>
            <div className="field">
              <label>Profesija</label>
              <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="dizainerė" />
            </div>
          </div>
          <div className="hint" style={{ marginTop: -8, marginBottom: 18 }}>
            Rodoma kaip „{[age, profession].filter(Boolean).join(' · ') || '…'}“. Galite palikti vieną lauką tuščią.
          </div>

          <div className="field">
            <label>Istorija</label>
            <textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="Pastraipas atskirkite tuščia eilute." />
            <div className="hint">Kiekviena pastraipa atskiriama tuščia eilute.</div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saugoma…' : 'Išsaugoti'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Atšaukti</button>
          </div>
        </form>
      </div>
    </div>
  );
}
