'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Found = {
  products: { id: string; name: string; sku: string; status: string }[];
  orders: { id: string; number: string; customer: string; status: string; total: number }[];
};
const EMPTY: Found = { products: [], orders: [] };

const PAGES: [string, string][] = [
  ['Dashboard', '/admin'],
  ['Products', '/admin/products'],
  ['Add product', '/admin/products/new'],
  ['Categories', '/admin/categories'],
  ['Orders', '/admin/orders'],
  ['Pending orders', '/admin/orders?status=Pending'],
  ['Customers', '/admin/customers'],
  ['Subscribers', '/admin/subscribers'],
  ['Tools: backup and exports', '/admin/tools'],
  ['Settings and themes', '/admin/settings'],
];

/** Ctrl/⌘ + K quick jump: admin pages, products and orders. */
export default function AdminPalette({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Found>(EMPTY);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 0);
    else {
      setQ('');
      setFound(EMPTY);
    }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setFound(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (r.ok) setFound(await r.json());
      } catch {
        /* aborted or offline */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const term = q.trim().toLowerCase();
  const pages = PAGES.filter(([label]) => !term || label.toLowerCase().includes(term));
  const row = 'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-ivory/90 hover:bg-gold/10 hover:text-gold focus:bg-gold/10 focus:outline-none';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`flex w-full items-center justify-between rounded-lg border border-gold/25 px-3 py-2 text-xs text-mute hover:border-gold hover:text-gold ${className}`} aria-label="Search the admin (Ctrl+K)">
        <span>Quick search</span>
        <kbd className="rounded border border-gold/30 px-1.5 text-[10px]">Ctrl K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center bg-black/70 p-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)} role="dialog" aria-modal="true" aria-label="Quick search">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gold/40 bg-coal shadow-2xl">
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages, products, orders, customers…" className="w-full border-b border-gold/20 bg-transparent px-4 py-3.5 text-sm text-ivory outline-none placeholder:text-mute" />
            <div className="max-h-[55vh] space-y-3 overflow-y-auto p-2">
              {pages.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.2em] text-mute">Go to</p>
                  {pages.map(([label, href]) => <button key={href} type="button" className={row} onClick={() => go(href)}>{label}</button>)}
                </div>
              )}
              {found.products.length > 0 && (
                <div>
                  <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-mute">Products</p>
                  {found.products.map((p) => <button key={p.id} type="button" className={row} onClick={() => go(`/admin/products/${p.id}`)}><span>{p.name}</span><span className="text-xs text-mute">{p.sku || p.status}</span></button>)}
                </div>
              )}
              {found.orders.length > 0 && (
                <div>
                  <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-mute">Orders</p>
                  {found.orders.map((o) => <button key={o.id} type="button" className={row} onClick={() => go(`/admin/orders?q=${encodeURIComponent(o.number)}`)}><span>{o.number} · {o.customer}</span><span className="text-xs text-mute">{o.status}</span></button>)}
                </div>
              )}
              {term.length >= 2 && (
                <button type="button" className={row} onClick={() => go(`/admin/customers?q=${encodeURIComponent(q.trim())}`)}>
                  <span>Search customers for “{q.trim()}”</span><span className="text-xs text-mute">↵</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
