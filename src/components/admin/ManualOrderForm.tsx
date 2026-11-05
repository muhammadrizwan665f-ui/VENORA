'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createManualOrder } from '@/app/admin/actions';
import { ORDER_STATUSES } from '@/lib/types';

type P = { id: string; name: string };

export default function ManualOrderForm({ products }: { products: P[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const start = (fn: () => Promise<void>) => { setPending(true); fn().finally(() => setPending(false)); };
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const [c, setC] = useState({ name: '', whatsapp: '', country: '', city: '', address: '', notes: '' });
  const [lines, setLines] = useState([{ productId: products[0]?.id ?? '', qty: 1, variant: '' }]);
  const [status, setStatus] = useState('Pending');
  const [shipping, setShipping] = useState('');

  if (!open) return <button type="button" className="btn-outline" onClick={() => setOpen(true)}>+ Add manual order</button>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    start(async () => {
      const r = await createManualOrder({ customer: c, lines, status, shipping: shipping === '' ? null : Number(shipping) });
      if (!r.ok) return setErr(r.error || 'Could not create order.');
      setOpen(false);
      setLines([{ productId: products[0]?.id ?? '', qty: 1, variant: '' }]);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gold/40 bg-coal p-5">
      <h2 className="font-serif text-2xl text-gold">New manual order</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input-lux" placeholder="Customer name *" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} required />
        <input className="input-lux" placeholder="WhatsApp number *" value={c.whatsapp} onChange={(e) => setC({ ...c, whatsapp: e.target.value })} required />
        <input className="input-lux" placeholder="Country" value={c.country} onChange={(e) => setC({ ...c, country: e.target.value })} />
        <input className="input-lux" placeholder="City" value={c.city} onChange={(e) => setC({ ...c, city: e.target.value })} />
        <input className="input-lux sm:col-span-2" placeholder="Delivery address" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} />
        <input className="input-lux sm:col-span-2" placeholder="Notes" value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} />
      </div>
      {lines.map((l, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-[1fr_140px_90px_auto]">
          <select className="input-lux" value={l.productId} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className="input-lux" placeholder="Variant" value={l.variant} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, variant: e.target.value } : x)))} />
          <input className="input-lux" type="number" min="1" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} />
          <button type="button" className="text-sm text-red-400" onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length === 1}>Remove</button>
        </div>
      ))}
      <button type="button" className="text-sm text-gold underline underline-offset-4" onClick={() => setLines([...lines, { productId: products[0]?.id ?? '', qty: 1, variant: '' }])}>+ Add another product</button>
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="input-lux" value={status} onChange={(e) => setStatus(e.target.value)}>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <input className="input-lux" type="number" min="0" step="0.01" placeholder="Shipping (blank = store default)" value={shipping} onChange={(e) => setShipping(e.target.value)} />
      </div>
      <p className="text-xs text-mute">Prices come from the catalogue automatically.</p>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending || !products.length} className="btn-gold">{pending ? 'Saving…' : 'Create order'}</button>
        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
