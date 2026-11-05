'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { ProductSummary, StoreSettings } from '@/lib/types';
import { effectivePrice } from '@/lib/types';
import { addLine, countItems, parseLines, removeLine, setQty as setQtyFn, totals as totalsFn, type CartLine } from '@/lib/cartMath';

const CART_KEY = 'venora.cart.v1';
const WISH_KEY = 'venora.wish.v1';

type AddInput = { product: Pick<ProductSummary, 'id' | 'slug' | 'name' | 'price' | 'salePrice' | 'image'>; qty?: number; variant?: string };

type Ctx = {
  settings: StoreSettings;
  hydrated: boolean;
  lines: CartLine[];
  count: number;
  totals: { subtotal: number; shipping: number; total: number };
  addToCart: (i: AddInput) => void;
  setQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  /** Refresh cart prices + wishlist snapshots from fresh catalogue data. */
  syncCatalog: (fresh: ProductSummary[]) => void;
  wishlist: ProductSummary[];
  isWished: (id: string) => boolean;
  toggleWish: (p: ProductSummary) => void;
  notify: (message: string, cta?: { label: string; href: string }) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore must be used inside <StoreProvider>');
  return c;
}

function readWish(): ProductSummary[] {
  try {
    const arr = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === 'string' && typeof p.slug === 'string') : [];
  } catch {
    return [];
  }
}

export default function StoreProvider({ settings, children }: { settings: StoreSettings; children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<ProductSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{ message: string; cta?: { label: string; href: string } } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted cart + wishlist (localStorage can be unavailable: private mode, blocked storage).
  useEffect(() => {
    try {
      setLines(parseLines(localStorage.getItem(CART_KEY)));
      setWishlist(readWish());
    } catch {
      /* storage unavailable: start empty */
    }
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setLines(parseLines(e.newValue));
      if (e.key === WISH_KEY) setWishlist(readWish());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, []);

  const notify = useCallback((message: string, cta?: { label: string; href: string }) => {
    setToast({ message, cta });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const updateLines = useCallback(
    (fn: (l: CartLine[]) => CartLine[]) => {
      setLines((prev) => {
        const next = fn(prev);
        persist(CART_KEY, next);
        return next;
      });
    },
    [persist],
  );

  const addToCart = useCallback(
    ({ product, qty = 1, variant }: AddInput) => {
      updateLines((l) =>
        addLine(l, {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: effectivePrice(product),
          qty,
          variant,
        }),
      );
      notify(`${product.name} added to your cart`, { label: 'View cart', href: '/cart' });
    },
    [updateLines, notify],
  );

  const setQty = useCallback((key: string, qty: number) => updateLines((l) => setQtyFn(l, key, qty)), [updateLines]);
  const removeFromCart = useCallback((key: string) => updateLines((l) => removeLine(l, key)), [updateLines]);
  const clearCart = useCallback(() => updateLines(() => []), [updateLines]);

  const syncCatalog = useCallback(
    (fresh: ProductSummary[]) => {
      const byId = new Map(fresh.map((p) => [p.id, p]));
      updateLines((l) =>
        l.map((line) => {
          const p = byId.get(line.productId);
          return p ? { ...line, price: effectivePrice(p), name: p.name, image: p.image } : line;
        }),
      );
      setWishlist((prev) => {
        const next = prev.map((w) => byId.get(w.id) ?? w);
        persist(WISH_KEY, next);
        return next;
      });
    },
    [updateLines, persist],
  );

  const toggleWish = useCallback(
    (p: ProductSummary) => {
      setWishlist((prev) => {
        const has = prev.some((x) => x.id === p.id);
        const next = has ? prev.filter((x) => x.id !== p.id) : [...prev, p];
        persist(WISH_KEY, next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<Ctx>(
    () => ({
      settings,
      hydrated,
      lines,
      count: countItems(lines),
      totals: totalsFn(lines, settings),
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      syncCatalog,
      wishlist,
      isWished: (id: string) => wishlist.some((p) => p.id === id),
      toggleWish,
      notify,
    }),
    [settings, hydrated, lines, addToCart, setQty, removeFromCart, clearCart, syncCatalog, wishlist, toggleWish, notify],
  );

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center px-4 sm:bottom-6">
        {toast && (
          <div className="pointer-events-auto flex max-w-md animate-fadeUp items-center gap-3 rounded-full border border-gold/50 bg-coal/95 px-5 py-3 text-sm text-ivory shadow-[0_10px_40px_-10px_rgb(var(--c-gold)/0.5)] backdrop-blur">
            <span>{toast.message}</span>
            {toast.cta && (
              <Link href={toast.cta.href} className="whitespace-nowrap font-medium text-gold underline underline-offset-4">
                {toast.cta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </StoreCtx.Provider>
  );
}
