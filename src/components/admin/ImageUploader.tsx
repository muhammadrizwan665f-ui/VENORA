'use client';

import { useRef, useState } from 'react';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
const MAX_BYTES = 10 * 1024 * 1024;
const BATCH = 4; // files per request (keeps each request small); the total number of images is not limited

function send(files: File[], onProgress: (pct: number) => void): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new Error('Network error while uploading. Please try again.'));
    xhr.onload = () => {
      let data: { urls?: string[]; error?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.urls) return resolve(data.urls);
      if (xhr.status === 401 || xhr.status === 403) return reject(new Error('Your admin session has expired. Please log in again.'));
      reject(new Error(data.error || `Upload failed (HTTP ${xhr.status}).`));
    };
    xhr.send(fd);
  });
}

/**
 * Visual multi-image uploader: "Upload Images" button + drag & drop, instant previews,
 * progress bar, remove / reorder, and readable errors. There is intentionally no URL text field.
 * `onChange` receives an updater so concurrent uploads never overwrite each other.
 */
export default function ImageUploader({
  value, onChange, max = 1000, multiple = true, label = 'Upload Images', hint,
}: {
  value: string[];
  onChange: (update: (prev: string[]) => string[]) => void;
  max?: number;
  multiple?: boolean;
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  async function handle(list: FileList | File[] | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setErr('');
    const room = multiple ? max - value.length : 1;
    if (room <= 0) return setErr(`You can add up to ${max} image${max === 1 ? '' : 's'}. Remove one first.`);
    const problems: string[] = [];
    const ok = files.filter((f) => {
      if (!ACCEPT.split(',').includes(f.type)) { problems.push(`${f.name}: only JPG, PNG, WebP, AVIF or GIF images are allowed.`); return false; }
      if (f.size > MAX_BYTES) { problems.push(`${f.name} is larger than 10 MB.`); return false; }
      return true;
    }).slice(0, room);
    if (files.length > ok.length && !problems.length) problems.push(`Only ${ok.length} of ${files.length} images were added (limit reached).`);
    if (!ok.length) return setErr(problems.join(' '));
    const local = ok.map((f) => URL.createObjectURL(f));
    setPreviews(local); setBusy(true); setPct(0);
    let done = 0;
    try {
      // Upload in small batches so any number of photos works; each finished batch appears immediately.
      for (let i = 0; i < ok.length; i += BATCH) {
        const batch = ok.slice(i, i + BATCH);
        const urls = await send(batch, (p) => setPct(Math.round(((done + (p / 100) * batch.length) / ok.length) * 100)));
        done += batch.length;
        onChange((prev) => (multiple ? [...prev, ...urls].slice(0, max) : urls.slice(0, 1)));
        setPreviews((cur) => cur.slice(batch.length));
      }
      if (problems.length) setErr(problems.join(' '));
    } catch (e) {
      setErr(`${done ? `${done} of ${ok.length} uploaded. ` : ''}${(e as Error).message}`);
    } finally {
      local.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]); setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const move = (i: number, d: number) => onChange((prev) => {
    const a = [...prev]; const j = i + d;
    if (j < 0 || j >= a.length) return prev;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  });

  return (
    <div className="space-y-3">
      {(value.length > 0 || previews.length > 0) && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((u, i) => (
            <li key={u + i} className="space-y-1">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Uploaded image ${i + 1}`} className="aspect-square w-full rounded-lg border border-gold/30 bg-black object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gold">Main</span>}
              </div>
              <div className="flex justify-between text-xs">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="px-2 text-gold disabled:opacity-30">←</button>
                <button type="button" onClick={() => onChange((prev) => prev.filter((_, x) => x !== i))} className="text-red-400">Remove</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move later" className="px-2 text-gold disabled:opacity-30">→</button>
              </div>
            </li>
          ))}
          {previews.map((u) => (
            <li key={u} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="Uploading" className="aspect-square w-full animate-pulse rounded-lg border border-gold/30 bg-black object-cover opacity-60" />
              <p className="text-center text-[10px] text-mute">Uploading…</p>
            </li>
          ))}
        </ul>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void handle(e.dataTransfer.files); }}
        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition ${drag ? 'border-gold bg-gold/10' : 'border-gold/40'}`}
      >
        <input ref={input} type="file" accept={ACCEPT} multiple={multiple} className="hidden" onChange={(e) => void handle(e.target.files)} />
        <button type="button" className="btn-gold !py-2.5 text-[11px]" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? `Uploading… ${pct}%` : label}
        </button>
        <p className="text-xs text-mute">{hint ?? `Click the button or drop ${multiple ? 'images' : 'an image'} here · JPG, PNG, WebP, AVIF or GIF · up to 10 MB each`}</p>
        {busy && (
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gold/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
    </div>
  );
}
