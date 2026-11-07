'use server';

import { isThemeId } from '@/lib/themes';
import { safeBack, withNotice } from '@/lib/adminTools';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { isAdminConfigured, isSupabaseConfigured } from '@/lib/supabase/env';
import { isAdminEmail, requireAdmin } from '@/lib/auth';
import { seedCategories, seedProducts } from '@/lib/seed';
import { generateOrderRef, normalizeWhatsapp } from '@/lib/whatsapp';
import { shippingFor, round2 } from '@/lib/cartMath';
import { adminSettings } from '@/lib/adminData';
import { effectivePrice, ORDER_STATUSES, type OrderItem, type Variant } from '@/lib/types';

export type ActionResult = { ok: boolean; error?: string; id?: string };

const refresh = () => {
  revalidateTag('catalog');
  revalidatePath('/', 'layout');
};
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const text = (v: FormDataEntryValue | null, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: FormDataEntryValue | null, d = 0) => {
  const n = Number(typeof v === 'string' ? v : NaN);
  return Number.isFinite(n) ? n : d;
};
const ids = (formData: FormData) =>
  formData.getAll('ids').filter((v): v is string => typeof v === 'string' && /^[0-9a-f-]{8,40}$/i.test(v)).slice(0, 500);
/** Redirects back to the admin page the form came from, with a notice/error banner. */
function finish(formData: FormData, fallback: string, key: 'notice' | 'error', message: string): never {
  return redirect(withNotice(safeBack(formData.get('back'), fallback), key, message));
}
const safeUrl = (u: unknown) => typeof u === 'string' && (u.startsWith('/') || /^https:\/\//i.test(u)) && u.length < 1000;

/* ───────── auth ───────── */

export async function login(formData: FormData): Promise<{ error: string } | void> {
  if (!isSupabaseConfigured()) return { error: 'Supabase is not configured yet (see README).' };
  const email = text(formData.get('email'), 200).toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };
  if (!isAdminEmail(email)) return { error: 'Invalid email or password.' }; // same message: no account enumeration
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Invalid email or password.' };
  redirect('/admin');
}

export async function logout() {
  if (isSupabaseConfigured()) await (await createAuthClient()).auth.signOut();
  redirect('/admin/login');
}

/* ───────── products ───────── */

export type ProductInput = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  salePrice: number | null;
  images: string[];
  variants: Variant[];
  variantCombinations: { options: Record<string, string>; price: number; salePrice: number | null; sku: string; stock: number; images: string[] }[];
  stock: number;
  status: 'active' | 'draft';
  badge: 'Hot' | 'New' | null;
  rating: number | null;
  reviewCount: number;
  bestSeller: boolean;
  sku: string;
};

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  await requireAdmin();
  const name = String(input.name ?? '').trim().slice(0, 140);
  const slug = slugify(input.slug || name);
  if (!name || !slug) return { ok: false, error: 'Name is required.' };
  if (!input.category) return { ok: false, error: 'Choose a category (create one first if the list is empty).' };
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'Enter a valid price.' };
  let sale: number | null = input.salePrice === null || input.salePrice === undefined || Number.isNaN(Number(input.salePrice)) ? null : Number(input.salePrice);
  if (sale !== null && (sale <= 0 || sale >= price)) sale = null; // a sale price must be lower than the regular price
  const images = (Array.isArray(input.images) ? input.images : []).filter(safeUrl).slice(0, 12);
  const variants: Variant[] = (Array.isArray(input.variants) ? input.variants : [])
    .map((v) => ({ name: String(v.name ?? '').trim().slice(0, 40), options: (Array.isArray(v.options) ? v.options : []).map((o) => String(o).trim().slice(0, 40)).filter(Boolean).slice(0, 30) }))
    .filter((v) => v.name && v.options.length)
    .slice(0, 6);
  const variantCombinations = (Array.isArray(input.variantCombinations) ? input.variantCombinations : []).slice(0, 250).map((c) => {
    const options = c?.options && typeof c.options === 'object' ? Object.fromEntries(Object.entries(c.options).filter(([k, v]) => variants.some((g) => g.name === k && g.options.includes(String(v))).map(([k, v]) => [k, String(v)])) : {};
    const price = Number(c?.price);
    const rawSale = c?.salePrice === null || c?.salePrice === undefined || c?.salePrice === '' ? null : Number(c.salePrice);
    return { options, price: Number.isFinite(price) && price >= 0 ? round2(price) : 0, salePrice: rawSale !== null && Number.isFinite(rawSale) && rawSale > 0 && rawSale < price ? round2(rawSale) : null, sku: String(c?.sku ?? '').slice(0, 60), stock: Math.max(0, Math.floor(Number(c?.stock) || 0)), images: (Array.isArray(c?.images) ? c.images : []).filter(safeUrl).slice(0, 12) };
  }).filter((c) => Object.keys(c.options).length === variants.length && variants.length > 0);
  if (variants.length && variantCombinations.length === 0) return { ok: false, error: 'Add at least one valid combination for the selected variant options.' };
  const rating = input.rating === null || input.rating === undefined || Number.isNaN(Number(input.rating)) ? null : Math.min(5, Math.max(0, Number(input.rating)));

  const row = {
    name,
    slug,
    category_slug: input.category,
    description: String(input.description ?? '').slice(0, 5000),
    price: round2(price),
    sale_price: sale === null ? null : round2(sale),
    images,
    variants,
    variant_combinations: variantCombinations,
    stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
    status: input.status === 'draft' ? 'draft' : 'active',
    badge: input.badge === 'Hot' || input.badge === 'New' ? input.badge : null,
    rating,
    review_count: Math.max(0, Math.floor(Number(input.reviewCount) || 0)),
    best_seller: !!input.bestSeller,
    sku: String(input.sku ?? '').trim().slice(0, 60),
  };

  const db = createServiceClient();
  const res = input.id ? await db.from('products').update(row).eq('id', input.id).select('id').single() : await db.from('products').insert(row).select('id').single();
  if (res.error) {
    return { ok: false, error: res.error.code === '23505' ? 'That URL slug is already used by another product.' : res.error.message };
  }
  refresh();
  return { ok: true, id: res.data.id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await createServiceClient().from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function duplicateProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const db = createServiceClient();
  const { data: src } = await db.from('products').select('*').eq('id', text(formData.get('id'), 60)).maybeSingle();
  if (!src) finish(formData, '/admin/products', 'error', 'Product not found.');
  const { id: _id, created_at: _c, ...rest } = src as Record<string, unknown>;
  void _id; void _c;
  for (let attempt = 0; attempt < 4; attempt++) {
    const suffix = attempt === 0 ? 'copy' : `copy-${Math.random().toString(36).slice(2, 6)}`;
    const row = { ...rest, name: `${String(rest.name).slice(0, 120)} (Copy)`, slug: `${String(rest.slug).slice(0, 70)}-${suffix}`, sku: '', status: 'draft', best_seller: false };
    const { data, error } = await db.from('products').insert(row).select('id').single();
    if (!error && data) {
      refresh();
      redirect(`/admin/products/${data.id}`);
    }
    if (error && error.code !== '23505') finish(formData, '/admin/products', 'error', error.message);
  }
  finish(formData, '/admin/products', 'error', 'Could not create a unique copy. Try again.');
}

export async function quickUpdateProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData.get('id'), 60);
  const price = num(formData.get('price'), NaN);
  const stock = Math.floor(num(formData.get('stock'), NaN));
  const status = text(formData.get('status'), 10) === 'draft' ? 'draft' : 'active';
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) return;
  const db = createServiceClient();
  const { data: cur } = await db.from('products').select('sale_price').eq('id', id).maybeSingle();
  if (!cur) return;
  const sale = cur.sale_price === null ? null : Number(cur.sale_price);
  // a sale price must stay below the regular price
  const sale_price = sale !== null && sale >= price ? null : sale;
  await db.from('products').update({ price: round2(price), stock, status, sale_price }).eq('id', id);
  refresh();
  revalidatePath('/admin/products');
}

export async function bulkProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const list = ids(formData);
  const action = text(formData.get('action'), 10);
  if (!list.length) finish(formData, '/admin/products', 'error', 'Select at least one product first.');
  const db = createServiceClient();
  let error: { message: string } | null = null;
  let label = '';
  if (action === 'publish' || action === 'draft') {
    ({ error } = await db.from('products').update({ status: action === 'publish' ? 'active' : 'draft' }).in('id', list));
    label = action === 'publish' ? 'published' : 'moved to draft';
  } else if (action === 'delete') {
    ({ error } = await db.from('products').delete().in('id', list));
    label = 'deleted';
  } else {
    finish(formData, '/admin/products', 'error', 'Unknown action.');
  }
  refresh();
  if (error) finish(formData, '/admin/products', 'error', error.message);
  finish(formData, '/admin/products', 'notice', `${list.length} product${list.length === 1 ? '' : 's'} ${label}.`);
}

export async function deleteSubscriber(formData: FormData): Promise<void> {
  await requireAdmin();
  await createServiceClient().from('subscribers').delete().eq('id', text(formData.get('id'), 60));
  revalidatePath('/admin/subscribers');
}

/* ───────── categories ───────── */

export async function saveCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData.get('id'), 60);
  const name = text(formData.get('name'), 80);
  const slug = slugify(text(formData.get('slug'), 80) || name);
  if (!name || !slug) return;
  const image = text(formData.get('image'), 1000);
  const row = { name, slug, image: safeUrl(image) ? image : '', description: text(formData.get('description'), 400), sort: Math.floor(num(formData.get('sort'))) };
  const db = createServiceClient();
  const { error } = id ? await db.from('categories').update(row).eq('id', id) : await db.from('categories').insert(row);
  if (error) console.error('[venora] saveCategory:', error.message);
  refresh();
  revalidatePath('/admin/categories');
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const { error } = await createServiceClient().from('categories').delete().eq('id', text(formData.get('id'), 60));
  if (error) console.error('[venora] deleteCategory (products may still use it):', error.message);
  refresh();
  revalidatePath('/admin/categories');
}

/* ───────── orders ───────── */

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const status = text(formData.get('status'), 20);
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return;
  await createServiceClient().from('orders').update({ status }).eq('id', text(formData.get('id'), 60));
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function deleteOrder(formData: FormData): Promise<void> {
  await requireAdmin();
  await createServiceClient().from('orders').delete().eq('id', text(formData.get('id'), 60));
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function bulkUpdateOrderStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const list = ids(formData);
  const status = text(formData.get('status'), 20);
  if (!list.length) finish(formData, '/admin/orders', 'error', 'Select at least one order first.');
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) finish(formData, '/admin/orders', 'error', 'Choose a valid status.');
  const { error } = await createServiceClient().from('orders').update({ status }).in('id', list);
  revalidatePath('/admin', 'layout');
  if (error) finish(formData, '/admin/orders', 'error', error.message);
  finish(formData, '/admin/orders', 'notice', `${list.length} order${list.length === 1 ? '' : 's'} set to ${status}.`);
}

export async function saveOrderNote(formData: FormData): Promise<void> {
  await requireAdmin();
  const note = text(formData.get('admin_notes'), 1000);
  await createServiceClient().from('orders').update({ admin_notes: note }).eq('id', text(formData.get('id'), 60));
  revalidatePath('/admin/orders');
}

export type ManualOrderInput = {
  customer: { name: string; whatsapp: string; country: string; city: string; address: string; notes: string };
  lines: { productId: string; qty: number; variant?: string }[];
  status: string;
  shipping: number | null;
};

export async function createManualOrder(input: ManualOrderInput): Promise<ActionResult> {
  await requireAdmin();
  const c = input.customer;
  if (!c.name?.trim() || normalizeWhatsapp(c.whatsapp).length < 7) return { ok: false, error: 'Customer name and a valid WhatsApp number are required.' };
  if (!input.lines?.length) return { ok: false, error: 'Add at least one product.' };
  const db = createServiceClient();
  const ids = input.lines.map((l) => l.productId);
  const { data: rows } = await db.from('products').select('id, slug, name, price, sale_price').in('id', ids);
  const items: OrderItem[] = [];
  for (const l of input.lines) {
    const p = rows?.find((r) => r.id === l.productId);
    const qty = Math.floor(Number(l.qty));
    if (!p || !(qty >= 1 && qty <= 999)) return { ok: false, error: 'A product line is invalid.' };
    items.push({ productId: p.id, slug: p.slug, name: p.name, price: effectivePrice({ price: Number(p.price), salePrice: p.sale_price === null ? null : Number(p.sale_price) }), qty, variant: l.variant?.trim().slice(0, 120) || undefined });
  }
  const settings = await adminSettings();
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
  const shipping = input.shipping !== null && Number.isFinite(input.shipping) && input.shipping >= 0 ? round2(input.shipping) : shippingFor(subtotal, settings);
  const status = (ORDER_STATUSES as readonly string[]).includes(input.status) ? input.status : 'Pending';

  const { error } = await db.from('orders').insert({
    order_number: generateOrderRef(),
    source: 'manual',
    status,
    customer_name: c.name.trim().slice(0, 100),
    whatsapp: c.whatsapp.trim().slice(0, 30),
    country: c.country?.trim().slice(0, 80) ?? '',
    city: c.city?.trim().slice(0, 80) ?? '',
    address: c.address?.trim().slice(0, 400) ?? '',
    notes: c.notes?.trim().slice(0, 500) ?? '',
    items,
    subtotal,
    shipping,
    total: round2(subtotal + shipping),
    currency: settings.currency,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { ok: true };
}

/* ───────── settings ───────── */

export async function saveSettings(formData: FormData): Promise<void> {
  await requireAdmin();
  const logo = text(formData.get('logo_url'), 1000);
  const url = (k: string) => {
    const v = text(formData.get(k), 300);
    return /^https:\/\//i.test(v) ? v : '';
  };
  const row = {
    id: 1,
    store_name: text(formData.get('store_name'), 80) || 'VENORA JEWELRY',
    tagline: text(formData.get('tagline'), 120),
    whatsapp_number: normalizeWhatsapp(text(formData.get('whatsapp_number'), 30)) || '923435295541',
    currency: text(formData.get('currency'), 8).toUpperCase() || 'USD',
    currency_symbol: text(formData.get('currency_symbol'), 4) || '$',
    shipping_flat: Math.max(0, num(formData.get('shipping_flat'))),
    free_shipping_over: Math.max(0, num(formData.get('free_shipping_over'))),
    logo_url: safeUrl(logo) ? logo : '',
    email: text(formData.get('email'), 200),
    phone: text(formData.get('phone'), 40),
    address: text(formData.get('address'), 400),
    instagram: url('instagram'),
    tiktok: url('tiktok'),
    youtube: url('youtube'),
    pinterest: url('pinterest'),
    facebook: url('facebook'),
    theme: isThemeId(formData.get('theme')) ? String(formData.get('theme')) : 'noir-gold',
  };
  const { error } = await createServiceClient().from('store_settings').upsert(row);
  if (error) redirect(`/admin/settings?error=${encodeURIComponent(error.message.slice(0, 240))}`);
  refresh();
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

/* ───────── sample data ───────── */

export async function importSampleCatalogue(): Promise<void> {
  await requireAdmin();
  if (!isAdminConfigured()) return;
  const db = createServiceClient();
  await db.from('categories').upsert(seedCategories.map((c) => ({ slug: c.slug, name: c.name, image: c.image, description: c.description, sort: c.sort })), { onConflict: 'slug' });
  await db.from('products').upsert(
    seedProducts.map((p) => ({
      slug: p.slug, name: p.name, category_slug: p.category, description: p.description, price: p.price, sale_price: p.salePrice,
      images: p.images, variants: p.variants, stock: p.stock, status: p.status, badge: p.badge, rating: p.rating,
      review_count: p.reviewCount, best_seller: p.bestSeller, sku: p.sku,
    })),
    { onConflict: 'slug' },
  );
  refresh();
  revalidatePath('/admin', 'layout');
}
