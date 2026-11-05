import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Catalog from '@/components/Catalog';
import PageHero from '@/components/PageHero';
import { getCategories, getProducts } from '@/lib/data';
import { toSummary } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return { title: 'Collection not found' };
  return {
    title: `${cat.name} — Serpent Jewelry`,
    description: `${cat.description} Shop VENORA ${cat.name.toLowerCase()} and order on WhatsApp.`,
    alternates: { canonical: `/collections/${cat.slug}` },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const products = await getProducts({ category: cat.slug });
  return (
    <>
      <PageHero eyebrow="Collection" title={cat.name}>
        {cat.description}
      </PageHero>
      <Catalog products={products.map(toSummary)} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} active={cat.slug} />
    </>
  );
}
