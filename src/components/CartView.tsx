'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import SmartImage from './SmartImage';
import { useStore } from './StoreProvider';
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon } from './Icons';
import { buildCartMessage, generateOrderRef, money, waLink, type CustomerDetails } from '@/lib/whatsapp';
import { productUrl } from '@/lib/site';
import type { ProductSummary } from '@/lib/types';

type Sent = { ref: string; link: string; recorded: boolean | null };

export default function CartView() {
  const { lines, totals, setQty, removeFromCart, clearCart, settings, hydrated, syncCatalog } = useStore();
  const sym = settings.currencySymbol;
  const [checkout, setCheckout] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [form, setForm] = useState<CustomerDetails>({ name: '', whatsapp: '', country: '', city: '', address: '', notes: '' });
  const [err, setErr] = useState('');
  const synced = useRef(false);

  // Make sure the prices in the order message are today's prices.
  useEffect(() => {
    if (!hydrated || synced.current || lines.length === 0) return;
    synced.current = true;
    const slugs = Array.from(new Set(lines.map((l) => l.slug))).join(',');
    fetch(`/api/products?slugs=${encodeURIComponent(slugs)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((fresh: ProductSummary[]) => fresh.length && syncCatalog(fresh))
      .catch(() => undefined);
  }, [hydrated, lines, syncCatalog]);

  useEffect(() => {
    if (!checkout) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setCheckout(false);
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [checkout]);

  const set = (k: keyof CustomerDetails) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const f = { ...form, name: form.name.trim(), whatsapp: form.whatsapp.trim(), country: form.country.trim(), city: form.city.trim(), address: form.address.trim(), notes: (form.notes ?? '').trim() };
    if (!f.name || !f.country || !f.city || !f.address) return setErr('Please complete all required fields.');
    if (f.whatsapp.replace(/\D/g, '').length < 7) return setErr('Please enter a valid WhatsApp number including the country code.');
    setErr('');

    const ref = generateOrderRef();
    const message = buildCartMessage({
      ref,
      lines: lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty, variant: l.variant, url: productUrl(l.slug, window.location.origin) })),
      customer: f,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      symbol: sym,
    });
    const link = waLink(settings.whatsappNumber, message);

    // Best-effort record for the admin dashboard. Never blocks (or gates) opening WhatsApp.
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        ref,
        customer: f,
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant, variantOptions: l.variantOptions })),
      }),
    })
      .then((r) => setSent((s) => (s ? { ...s, recorded: r.ok } : s)))
      .catch(() => setSent((s) => (s ? { ...s, recorded: false } : s)));

    const w = window.open(link, '_blank', 'noopener,noreferrer'); // opened synchronously inside the click handler
    if (!w) window.location.href = link;
    setSent({ ref, link, recorded: null });
    setCheckout(false);
  }

  if (!hydrated) return <div className="container-x py-24 text-center text-mute">Loading your cart…</div>;

  if (sent) {
    return (
      <div className="container-x py-14">
        <div className="mx-auto max-w-xl rounded-2xl border border-gold/40 bg-coal p-8 text-center">
          <WhatsAppIcon className="mx-auto text-gold" width={44} height={44} />
          <h2 className="mt-4 font-serif text-3xl text-gold">Your order message is ready</h2>
          <p className="mt-2 text-sm text-ivory/80">
            WhatsApp should have opened with your order details. <strong className="text-ivory">Press Send</strong> to submit it. If it did not open, use the button below.
          </p>
          <p className="mt-4 rounded-lg border border-gold/20 bg-ink px-4 py-3 text-sm">
            Reference: <span className="font-semibold tracking-wider text-gold">{sent.ref}</span>
          </p>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Your order is <strong className="text-ivory/90">not confirmed or paid</strong> yet. We will reply on WhatsApp to confirm availability, the final total and payment details.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={sent.link} target="_blank" rel="noopener noreferrer" className="btn-gold"><WhatsAppIcon width={18} height={18} /> Open WhatsApp again</a>
            <button type="button" onClick={() => { clearCart(); setSent(null); }} className="btn-outline">Clear cart</button>
          </div>
          <button type="button" onClick={() => setSent(null)} className="mt-4 text-xs text-mute underline underline-offset-4 hover:text-gold">Back to cart</button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <p className="font-serif text-3xl text-ivory">Your cart is empty</p>
        <p className="mt-2 text-mute">Discover a piece with a little edge.</p>
        <Link href="/shop" className="btn-gold mt-8">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:gap-12">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-4 rounded-2xl border border-gold/25 bg-coal p-3 sm:p-4">
            <Link href={`/product/${l.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black sm:h-28 sm:w-28">
              <SmartImage src={l.image} alt={l.name} sizes="112px" className="object-cover" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/product/${l.slug}`} className="block font-serif text-lg leading-snug hover:text-gold sm:text-xl">{l.name}</Link>
                  {l.variant && <p className="mt-0.5 text-xs text-mute">{l.variant}</p>}
                  <p className="mt-1 text-sm text-gold">{money(l.price, sym)}</p>
                </div>
                <button type="button" onClick={() => removeFromCart(l.key)} aria-label={`Remove ${l.name}`} className="grid h-10 w-10 shrink-0 place-items-center text-mute transition hover:text-red-400">
                  <TrashIcon width={20} height={20} />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex items-center rounded-full border border-gold/40">
                  <button type="button" aria-label={`Decrease quantity of ${l.name}`} onClick={() => setQty(l.key, l.qty - 1)} className="grid h-10 w-10 place-items-center text-gold hover:text-ivory"><MinusIcon width={18} height={18} /></button>
                  <span className="w-8 text-center tabular-nums" aria-live="polite">{l.qty}</span>
                  <button type="button" aria-label={`Increase quantity of ${l.name}`} onClick={() => setQty(l.key, l.qty + 1)} className="grid h-10 w-10 place-items-center text-gold hover:text-ivory"><PlusIcon width={18} height={18} /></button>
                </div>
                <p className="font-semibold">{money(l.price * l.qty, sym)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border border-gold/40 bg-gradient-to-b from-coal to-ink p-6 lg:sticky lg:top-[calc(var(--header-h)+20px)]">
        <h2 className="font-serif text-2xl text-gold">Order summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{money(totals.subtotal, sym)}</dd></div>
          <div className="flex justify-between"><dt className="text-mute">Shipping</dt><dd>{totals.shipping > 0 ? money(totals.shipping, sym) : 'Free'}</dd></div>
          {settings.freeShippingOver > 0 && settings.shippingFlat > 0 && totals.shipping > 0 && (
            <p className="text-xs text-gold/80">Free shipping on orders over {money(settings.freeShippingOver, sym)}.</p>
          )}
          <div className="flex justify-between border-t border-gold/25 pt-4 text-lg"><dt className="font-serif">Grand total</dt><dd className="gold-text font-serif text-2xl font-semibold">{money(totals.total, sym)}</dd></div>
        </dl>
        <button type="button" onClick={() => setCheckout(true)} className="btn-gold mt-6 w-full !min-h-[54px] !text-sm">
          <WhatsAppIcon width={20} height={20} /> Checkout via WhatsApp
        </button>
        <p className="mt-3 text-center text-xs leading-relaxed text-mute">
          No online payment is taken here. We confirm availability, delivery and payment with you on WhatsApp.
        </p>
        <button type="button" onClick={clearCart} className="mt-4 w-full text-center text-xs text-mute underline underline-offset-4 hover:text-gold">Clear cart</button>
      </aside>

      {checkout && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Delivery details" onClick={() => setCheckout(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gold/40 bg-coal p-5 shadow-2xl sm:rounded-3xl sm:p-8" noValidate>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="font-serif text-3xl text-gold">Delivery details</h2>
                <p className="mt-1 text-xs text-mute">Sent to us on WhatsApp so we can confirm your order.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setCheckout(false)} className="-mr-2 grid h-10 w-10 place-items-center text-gold"><CloseIcon /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name *" className="sm:col-span-2"><input className="input-lux" value={form.name} onChange={set('name')} autoComplete="name" required maxLength={100} /></Field>
              <Field label="WhatsApp number *" className="sm:col-span-2"><input className="input-lux" type="tel" inputMode="tel" placeholder="+92 300 1234567" value={form.whatsapp} onChange={set('whatsapp')} autoComplete="tel" required maxLength={30} /></Field>
              <Field label="Country *"><input className="input-lux" value={form.country} onChange={set('country')} autoComplete="country-name" required maxLength={80} /></Field>
              <Field label="City *"><input className="input-lux" value={form.city} onChange={set('city')} autoComplete="address-level2" required maxLength={80} /></Field>
              <Field label="Complete delivery address *" className="sm:col-span-2"><textarea className="input-lux min-h-[84px]" value={form.address} onChange={set('address')} autoComplete="street-address" required maxLength={400} /></Field>
              <Field label="Additional instructions (optional)" className="sm:col-span-2"><textarea className="input-lux min-h-[64px]" value={form.notes} onChange={set('notes')} maxLength={500} /></Field>
            </div>
            {err && <p role="alert" className="mt-4 text-sm text-red-400">{err}</p>}
            <button type="submit" className="btn-gold mt-6 w-full !min-h-[54px] !text-sm"><WhatsAppIcon width={20} height={20} /> Send order on WhatsApp</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label-lux">{label}</span>
      {children}
    </label>
  );
}
