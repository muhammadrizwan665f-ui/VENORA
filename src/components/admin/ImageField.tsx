'use client';

import { useState } from 'react';

/** URL input + upload button. Submits the URL under `name` in the surrounding <form>. */
export default function ImageField({ name, defaultValue = '', label }: { name: string; defaultValue?: string; label: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr('');
    const fd = new FormData();
    fd.append('files', file);
    try {
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      setUrl(d.urls[0]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label-lux">{label}</span>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="h-12 w-12 rounded-md border border-gold/30 bg-black object-contain" /> : <span className="h-12 w-12 rounded-md border border-dashed border-gold/30" />}
        <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or upload" className="input-lux flex-1" />
        <label className="btn-outline cursor-pointer !px-4 !py-2 text-[11px]">
          {busy ? '…' : 'Upload'}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
    </div>
  );
}
