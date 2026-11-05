import 'server-only';
import { cache } from 'react';
import { createPublicClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/env';
import { defaultSettings, seedCategories, seedProducts } from './seed';
import { normalizeWhatsapp } from './whatsapp';
import { effectivePrice, type Category, type Product, type StoreSettings, type Variant } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const rowToProduct = (r: any): Product => ({
  id: String(r.id),
  slug: r.slug,
  name: r.name,
  category: r.category_slug ?? '',
  description: r.description ?? '',
  price: Number(r.price),
  salePrice: r.sale_price === null || r.sale_price === undefined ? null : Number(r.sale_price),
  images: Array.isArray(r.images) ? r.images : [],
  variants: Array.isArray(r.variants) ? (r.variants as Variant[]) : [],
  stock: Number(r.stock ?? 0),
  status: r.status === 'draft' ? 'draft' : 'active',
  badge: r.badge === 'Hot' || r.badge === 'New' ? r.badge : null,
  rating: r.rating === null || r.rating === undefined ? null : Number(r.rating),
  reviewCount: Number(r.review_count ?? 0),
  bestSeller: Boolean(r.best_seller),
  sku: r.sku ?? '',
  createdAt: r.created_at ?? new Date().toISOString(),
});

export const rowToCategory = (r: any): Category => ({
  id: String(r.id),
  slug: r.slug,
  name: r.name,
  image: r.image ?? '',
  description: r.description ?? '',
  sort: Number(r.sort ?? 0),
});

export const rowToSettings = (r: any): StoreSettings => ({
  storeName: r.store_name || defaultSettings.storeName,
  tagline: r.tagline || defaultSettings.tagline,
  whatsappNumber: normalizeWhatsapp(r.whatsapp_number || '') || defaultSettings.whatsappNumber,
  currency: r.currency || 'USD',
  currencySymbol: r.currency_symbol || '$',
  shippingFlat: Number(r.shipping_flat ?? 0),
  freeShippingOver: Number(r.free_shipping_over ?? 0),
  logoUrl: r.logo_url || defaultSettings.logoUrl,
  email: r.email ?? '',
  phone: r.phone ?? '',
  address: r.address ?? '',
  instagram: r.instagram ?? '',
  tiktok: r.tiktok ?? '',
  youtube: r.youtube ?? '',
  pinterest: r.pinterest ?? '',
  facebook: r.facebook ?? '',
});

export const getSettings = cache(async (): Promise<StoreSettings> => {
  if (!isSupabaseConfigured()) return defaultSettings;
  const { data, error } = await createPublicClient().from('store_settings').select('*').eq('id', 1).maybeSingle();
  if (error) console.error('[venora] settings query failed:', error.message);
  return data ? rowToSettings(data) : defaultSettings;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return seedCategories;
  const { data, error } = await createPublicClient().from('categories').select('*').order('sort');
  if (error) console.error('[venora] categories query failed:', error.message);
  return (data ?? []).map(rowToCategory);
});

export const getAllProducts = cache(async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) return seedProducts;
  const { data, error } = await createPublicClient()
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) console.error('[venora] products query failed:', error.message);
  return (data ?? []).map(rowToProduct);
});

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc';

export async function getProducts(opts: { category?: string; q?: string; bestSeller?: boolean; sort?: SortKey; limit?: number } = {}) {
  let list = await getAllProducts();
  if (opts.category) list = list.filter((p) => p.category === opts.category);
  if (opts.bestSeller) list = list.filter((p) => p.bestSeller);
  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.includes(q) || p.description.toLowerCase().includes(q));
  }
  if (opts.sort === 'price-asc') list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
  else if (opts.sort === 'price-desc') list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
  else if (opts.sort === 'newest') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await getAllProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getRelated(p: Product, n = 4): Promise<Product[]> {
  const all = await getAllProducts();
  const same = all.filter((x) => x.id !== p.id && x.category === p.category);
  const rest = all.filter((x) => x.id !== p.id && x.category !== p.category);
  return [...same, ...rest].slice(0, n);
}
