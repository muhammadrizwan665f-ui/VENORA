'use client';

import { useState, type FormEvent } from 'react';
import { useStore } from './StoreProvider';
import { WhatsAppIcon } from './Icons';
import { money, waLink } from '@/lib/whatsapp';

type Result = { found: true; orderNumber: string; status: string; total: number; placedAt: string; itemCount: number } | { found: false };

const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'] as const;

export default function TrackForm() {
  const { settings } = useStore();
  const [ref, setRef] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setRes(null);
    try {
      const r = await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber: ref, whatsapp: phone }) });
      if (r.status === 503) setError('Online tracking is not available yet. Please message us on WhatsApp with your order reference and we will update you.');
      else if (r.status === 429) setError('Too many attempts. Please wait a minute and try again.');
      else if (!r.ok) setError('Something went wrong. Please try again.');
      else setRes(await r.json());
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const idx = res && res.found ? (steps as readonly string[]).indexOf(res.status) : -1;
  const cancelled = res && res.found && res.status === 'Cancelled';

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gold/30 bg-coal p-6 sm:p-8">
        <label className="block"><span className="label-lux">Order reference</span><input className="input-lux uppercase" placeholder="VEN-261104-AB12" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={20} required /></label>
        <label className="block"><span className="label-lux">WhatsApp number used on the order</span><input className="input-lux" type="tel" inputMode="tel" placeholder="+92 300 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} required /></label>
        <button type="submit" disabled={busy} className="btn-gold w-full">{busy ? 'Checking…' : 'Track order'}</button>
        <p className="text-xs text-mute">Your reference appears in the WhatsApp message you sent when ordering.</p>
      </form>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-gold/30 bg-coal p-5 text-sm text-ivory/85">
          <p>{error}</p>
          <a href={waLink(settings.whatsappNumber, `Hello VENORA JEWELRY! I would like an update on my order${ref ? ` ${ref.toUpperCase()}` : ''}.`)} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4"><WhatsAppIcon width={18} height={18} /> Ask on WhatsApp</a>
        </div>
      )}

      {res && !res.found && (
        <div role="status" className="mt-6 rounded-xl border border-gold/30 bg-coal p-5 text-sm text-ivory/85">
          <p>We couldn’t find an order matching those details. Check the reference and WhatsApp number, or ask us directly.</p>
          <a href={waLink(settings.whatsappNumber, `Hello VENORA JEWELRY! I would like an update on my order${ref ? ` ${ref.toUpperCase()}` : ''}.`)} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4"><WhatsAppIcon width={18} height={18} /> Ask on WhatsApp</a>
        </div>
      )}

      {res && res.found && (
        <div role="status" className="mt-6 rounded-2xl border border-gold/40 bg-coal p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-mute">Order {res.orderNumber}</p>
          <p className="mt-1 font-serif text-3xl text-gold">{res.status}</p>
          <p className="mt-1 text-sm text-ivory/75">{res.itemCount} item{res.itemCount === 1 ? '' : 's'} · {money(res.total, settings.currencySymbol)} · placed {new Date(res.placedAt).toLocaleDateString()}</p>
          {cancelled ? (
            <p className="mt-4 text-sm text-red-300">This order was cancelled. Message us if you have questions.</p>
          ) : (
            <ol className="mt-6 grid grid-cols-5 gap-1 text-center text-[10px] uppercase tracking-wider sm:text-xs">
              {steps.map((s, i) => (
                <li key={s} className={i <= idx ? 'text-gold' : 'text-mute/60'}>
                  <span className={`mx-auto mb-2 block h-2 w-full rounded-full ${i <= idx ? 'bg-gold' : 'bg-white/10'}`} />
                  {s}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
