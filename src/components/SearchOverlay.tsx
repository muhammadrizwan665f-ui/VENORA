'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import SmartImage from './SmartImage';
import { CloseIcon, SearchIcon } from './Icons';
import { useStore } from './StoreProvider';
import { effectivePrice } from '@/lib/types';
import type { ProductSummary } from '@/lib/types';
import { money } from '@/lib/whatsapp';

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const { settings } = useStore();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ProductSummary[] | null>(null);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error('bad');
        setResults(await res.json());
        setError(false);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError(true);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-ink/96 backdrop-blur-md" role="dialog" aria-label="Search">
      <div className="container-x flex items-center gap-3 border-b border-gold/25 py-4">
        <SearchIcon className="text-gold" width={24} height={24} />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search necklaces, rings, serpent…"
          className="min-w-0 flex-1 bg-transparent font-serif text-2xl text-ivory placeholder:text-mute/60 focus:outline-none"
          aria-label="Search products"
        />
        <button type="button" onClick={onClose} aria-label="Close search" className="grid h-11 w-11 place-items-center text-gold">
          <CloseIcon width={26} height={26} />
        </button>
      </div>
      <div className="container-x flex-1 overflow-y-auto py-6">
        {error && <p className="text-mute">Search is unavailable right now. Please try again.</p>}
        {!error && results === null && <p className="text-mute">Type at least 2 letters to search the collection.</p>}
        {results && results.length === 0 && <p className="text-mute">No pieces found for “{q}”.</p>}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results?.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 rounded-xl border border-gold/20 bg-coal p-3 transition hover:border-gold/60">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black">
                  <SmartImage src={p.image} alt="" sizes="64px" className="object-cover" />
                </span>
                <span>
                  <span className="block font-serif text-lg leading-tight">{p.name}</span>
                  <span className="text-sm text-gold">{money(effectivePrice(p), settings.currencySymbol)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
