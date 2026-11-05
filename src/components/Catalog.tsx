'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { effectivePrice, type ProductSummary } from '@/lib/types';

type Cat = { slug: string; name: string };

export default function Catalog({ products, categories, active }: { products: ProductSummary[]; categories: Cat[]; active?: string }) {
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const list = useMemo(() => {
    const l = [...products];
    if (sort === 'price-asc') l.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    else if (sort === 'price-desc') l.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    else if (sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }, [products, sort]);

  const pill = (isActive: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
      isActive ? 'border-gold bg-gold text-ink' : 'border-gold/30 text-ivory/90 hover:border-gold hover:text-gold'
    }`;

  return (
    <section className="container-x py-10 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <Link href="/shop" className={pill(!active)}>All</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`} className={pill(active === c.slug)}>
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-mute">{list.length} {list.length === 1 ? 'piece' : 'pieces'}</span>
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input-lux !w-auto !py-2 pr-8">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-20 text-center text-mute">No pieces here yet. New designs arrive soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </section>
  );
}
