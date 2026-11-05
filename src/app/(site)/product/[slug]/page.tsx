import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductView from '@/components/ProductView';
import ProductCard from '@/components/ProductCard';
import { getAllProducts, getCategories, getProductBySlug, getRelated, getSettings } from '@/lib/data';
import { effectivePrice, toSummary } from '@/lib/types';
import { productUrl, siteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: 'Piece not found' };
  const s = await getSettings();
  const description = `${p.description.slice(0, 130).trim()} Only ${s.currencySymbol}${effectivePrice(p).toFixed(2)}. Order on WhatsApp.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: 'website', title: p.name, description, url: productUrl(p.slug), images: p.images.slice(0, 1).map((i) => ({ url: i.startsWith('http') ? i : `${siteUrl()}${i}` })) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, categories, settings] = await Promise.all([getRelated(product), getCategories(), getSettings()]);
  const cat = categories.find((c) => c.slug === product.category);
  const abs = (u: string) => (u.startsWith('http') ? u : `${siteUrl()}${u}`);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku || undefined,
    image: product.images.map(abs),
    brand: { '@type': 'Brand', name: 'VENORA JEWELRY' },
    category: cat?.name,
    offers: {
      '@type': 'Offer',
      url: productUrl(product.slug),
      priceCurrency: settings.currency,
      price: effectivePrice(product).toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.rating !== null && product.reviewCount > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${siteUrl()}/shop` },
      ...(cat ? [{ '@type': 'ListItem', position: 3, name: cat.name, item: `${siteUrl()}/collections/${cat.slug}` }] : []),
      { '@type': 'ListItem', position: cat ? 4 : 3, name: product.name, item: productUrl(product.slug) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

      <nav aria-label="Breadcrumb" className="container-x pt-6 text-xs text-mute">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-gold">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/shop" className="hover:text-gold">Shop</Link></li>
          {cat && (
            <>
              <li aria-hidden="true">/</li>
              <li><Link href={`/collections/${cat.slug}`} className="hover:text-gold">{cat.name}</Link></li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ivory/80">{product.name}</li>
        </ol>
      </nav>

      <ProductView product={product} />

      {related.length > 0 && (
        <section aria-labelledby="related" className="container-x pb-16 pt-6">
          <h2 id="related" className="section-title mb-6 text-center">You May Also Love</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={toSummary(p)} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
