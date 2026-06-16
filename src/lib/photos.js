import { supabase } from './supabase';

// Photos are shown full-screen, so we keep them high quality: only downscale
// when a side exceeds MAX_EDGE (huge phone originals), and compress lightly.
const MAX_EDGE = 2560;   // px on the longest side — plenty for full-screen
const QUALITY = 0.9;     // JPEG quality (high)

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Returns a Blob: the original re-encoded (and downscaled only if oversized).
async function processImage(file) {
  // leave non-raster files (or already-small files) to the browser as-is
  if (!file.type.startsWith('image/')) return file;

  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));

  // already within bounds and a reasonable size? keep the original bytes
  if (scale === 1 && file.size <= 4 * 1024 * 1024) {
    URL.revokeObjectURL(img.src);
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', QUALITY));
  return blob || file;
}

// Process + upload to the `photos` bucket; returns the public URL.
export async function uploadPhoto(file) {
  const blob = await processImage(file);
  const ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg');
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort removal of a previously uploaded photo (e.g. when replacing it).
export async function deletePhoto(url) {
  if (!url) return;
  const marker = '/photos/';
  const i = url.indexOf(marker);
  if (i === -1) return; // not one of ours (e.g. an external URL)
  const path = url.slice(i + marker.length);
  await supabase.storage.from('photos').remove([path]);
}
