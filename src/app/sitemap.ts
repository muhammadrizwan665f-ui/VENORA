import type { MetadataRoute } from 'next';
import { getAllProducts, getCategories } from '@/lib/data';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const now = new Date();
  const statics = ['', '/shop', '/about', '/contact', '/track-order', '/faq', '/shipping-policy', '/return-policy', '/privacy-policy', '/terms-and-conditions'];
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${base}/collections/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: new Date(p.createdAt), changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
