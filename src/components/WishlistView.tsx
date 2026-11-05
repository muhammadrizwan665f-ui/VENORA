'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { useStore } from './StoreProvider';
import type { ProductSummary } from '@/lib/types';

export default function WishlistView() {
  const { wishlist, hydrated, syncCatalog } = useStore();
  const synced = useRef(false);

  useEffect(() => {
    if (!hydrated || synced.current || wishlist.length === 0) return;
    synced.current = true;
    fetch(`/api/products?slugs=${encodeURIComponent(wishlist.map((w) => w.slug).join(','))}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((fresh: ProductSummary[]) => fresh.length && syncCatalog(fresh))
      .catch(() => undefined);
  }, [hydrated, wishlist, syncCatalog]);

  if (!hydrated) return <div className="container-x py-24 text-center text-mute">Loading your wishlist…</div>;
  if (wishlist.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <p className="font-serif text-3xl">Your wishlist is empty</p>
        <p className="mt-2 text-mute">Tap the heart on any piece to save it here.</p>
        <Link href="/shop" className="btn-gold mt-8">Explore the collection</Link>
      </div>
    );
  }
  return (
    <section className="container-x py-10">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {wishlist.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
