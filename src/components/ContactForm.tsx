'use client';

import { useState, type FormEvent } from 'react';
import { useStore } from './StoreProvider';
import { WhatsAppIcon } from './Icons';
import { waLink } from '@/lib/whatsapp';

/** No email server is needed: the enquiry is sent as a WhatsApp message to the store. */
export default function ContactForm() {
  const { settings } = useStore();
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [err, setErr] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.message.trim()) return setErr('Please add your name and a message.');
    setErr('');
    const text = ['Hello VENORA JEWELRY!', '', `Name: ${f.name.trim()}`, f.email.trim() ? `Email: ${f.email.trim()}` : '', '', f.message.trim()].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
    const link = waLink(settings.whatsappNumber, text);
    const w = window.open(link, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = link;
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block"><span className="label-lux">Your name *</span><input className="input-lux" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" maxLength={100} required /></label>
      <label className="block"><span className="label-lux">Email (optional)</span><input className="input-lux" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" maxLength={200} /></label>
      <label className="block"><span className="label-lux">Message *</span><textarea className="input-lux min-h-[130px]" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={1000} required /></label>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <button type="submit" className="btn-gold w-full"><WhatsAppIcon width={18} height={18} /> Send via WhatsApp</button>
    </form>
  );
}
