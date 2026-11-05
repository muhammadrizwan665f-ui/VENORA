import type { Metadata } from 'next';
import Catalog from '@/components/Catalog';
import PageHero from '@/components/PageHero';
import { getCategories, getProducts } from '@/lib/data';
import { toSummary } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Shop All Jewelry',
  description: 'Browse every VENORA serpent-inspired piece: necklaces, bracelets, rings, earrings, anklets and jewelry sets. Order directly on WhatsApp.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <>
      <PageHero eyebrow="The Collection" title="Shop All">
        Every piece is inspired by the serpent: sinuous, bold and unmistakably feminine.
      </PageHero>
      <Catalog products={products.map(toSummary)} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
    </>
  );
}
