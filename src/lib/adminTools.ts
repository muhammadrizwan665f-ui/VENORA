/** Pure helpers for the admin area (filters, KPIs, CSV, message templates). No server/browser APIs, so they are unit-tested. */
import type { Order, Product } from './types';
import { effectivePrice } from './types';
import { money, normalizeWhatsapp } from './whatsapp';

/** The store's business time zone, used for "today", daily charts and displayed dates. */
export const ADMIN_TZ = 'Asia/Karachi';
export const LOW_STOCK = 3;
const DAY = 86_400_000;

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: ADMIN_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: ADMIN_TZ, dateStyle: 'medium', timeStyle: 'short' });
const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: ADMIN_TZ, dateStyle: 'medium' });

/** YYYY-MM-DD in the store time zone. */
export const dayKey = (d: Date | string | number): string => dayFmt.format(new Date(d));
export const fmtDateTime = (d: string | number | Date) => dateTimeFmt.format(new Date(d));
export const fmtDate = (d: string | number | Date) => dateFmt.format(new Date(d));
const keyAgo = (n: number, now: Date) => dayKey(now.getTime() - n * DAY);
const isDay = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const live = (orders: Order[]) => orders.filter((o) => o.status !== 'Cancelled');

/* ───────── CSV ───────── */

/** Escapes one CSV cell and neutralises spreadsheet formula injection (=, @, +x, -x). */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=@\t\r]/.test(s) || /^[+-][^0-9\s]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export const toCsv = (header: string[], rows: unknown[][]): string =>
  '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

export const ordersCsv = (orders: Order[]) =>
  toCsv(
    ['Order', 'Date', 'Status', 'Customer', 'WhatsApp', 'Country', 'City', 'Address', 'Items', 'Subtotal', 'Shipping', 'Total', 'Currency', 'Customer notes', 'Admin notes', 'Source'],
    orders.map((o) => [
      o.orderNumber, fmtDateTime(o.createdAt), o.status, o.customerName, o.whatsapp, o.country, o.city, o.address.replace(/\s*\n\s*/g, ', '),
      o.items.map((i) => `${i.qty} x ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join('; '),
      o.subtotal, o.shipping, o.total, o.currency, o.notes, o.adminNotes, o.source,
    ]),
  );

export const productsCsv = (products: Product[]) =>
  toCsv(
    ['Name', 'SKU', 'Category', 'Price', 'Sale price', 'Selling price', 'Stock', 'Status', 'Badge', 'Best seller', 'Variants', 'URL slug'],
    products.map((p) => [
      p.name, p.sku, p.category, p.price, p.salePrice ?? '', effectivePrice(p), p.stock, p.status, p.badge ?? '', p.bestSeller ? 'yes' : 'no',
      p.variants.map((v) => `${v.name}: ${v.options.join('/')}`).join('; '), p.slug,
    ]),
  );

/* ───────── orders ───────── */

export type OrderFilter = { q?: string; status?: string; from?: string; to?: string };

export function filterOrders(orders: Order[], f: OrderFilter, opts: { ignoreStatus?: boolean } = {}): Order[] {
  const q = (f.q ?? '').trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  return orders.filter((o) => {
    if (!opts.ignoreStatus && f.status && o.status !== f.status) return false;
    const k = dayKey(o.createdAt);
    if (isDay(f.from) && k < f.from) return false;
    if (isDay(f.to) && k > f.to) return false;
    if (q) {
      const hay = `${o.orderNumber} ${o.customerName} ${o.city} ${o.country} ${o.whatsapp}`.toLowerCase();
      const phoneHit = qDigits.length >= 4 && normalizeWhatsapp(o.whatsapp).includes(qDigits);
      if (!hay.includes(q) && !phoneHit) return false;
    }
    return true;
  });
}

export function statusCounts(orders: Order[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of orders) out[o.status] = (out[o.status] ?? 0) + 1;
  return out;
}

export type MessageKind = 'hello' | 'confirm' | 'shipped' | 'delivered';
/** Ready-made WhatsApp messages the admin can send to a customer about their order. */
export function statusMessage(o: Pick<Order, 'customerName' | 'orderNumber' | 'total'>, kind: MessageKind, store: string, sym: string): string {
  const name = o.customerName.trim() || 'there';
  const ref = o.orderNumber;
  switch (kind) {
    case 'confirm':
      return `Hello ${name}, thank you for ordering from ${store}! Your order ${ref} (total ${money(o.total, sym)}) is confirmed and we are preparing it now.`;
    case 'shipped':
      return `Hello ${name}, good news: your ${store} order ${ref} has been shipped. We will share any tracking details here on WhatsApp.`;
    case 'delivered':
      return `Hello ${name}, your ${store} order ${ref} should now be delivered. We hope you love it! Please tell us if anything is not perfect.`;
    default:
      return `Hello ${name}, this is ${store} regarding your order ${ref}.`;
  }
}

/* ───────── dashboard ───────── */

export type DayPoint = { day: string; revenue: number; orders: number };

export function dailySeries(orders: Order[], days: number, now = new Date()): DayPoint[] {
  const series: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) series.push({ day: keyAgo(i, now), revenue: 0, orders: 0 });
  const index = new Map(series.map((d, i) => [d.day, i]));
  for (const o of live(orders)) {
    const i = index.get(dayKey(o.createdAt));
    if (i !== undefined) {
      series[i].revenue += o.total;
      series[i].orders += 1;
    }
  }
  return series;
}

export function computeKpis(orders: Order[], now = new Date()) {
  const L = live(orders);
  const sum = (fromKey: string, toKey?: string) => {
    let revenue = 0, count = 0;
    for (const o of L) {
      const k = dayKey(o.createdAt);
      if (k >= fromKey && (!toKey || k <= toKey)) {
        revenue += o.total;
        count += 1;
      }
    }
    return { revenue, orders: count };
  };
  const today = sum(keyAgo(0, now), keyAgo(0, now));
  const week = sum(keyAgo(6, now));
  const month = sum(keyAgo(29, now));
  const prev = sum(keyAgo(59, now), keyAgo(30, now));
  const growth = prev.revenue > 0 ? ((month.revenue - prev.revenue) / prev.revenue) * 100 : null;
  const pending = orders.filter((o) => o.status === 'Pending');
  const stale = pending.filter((o) => now.getTime() - new Date(o.createdAt).getTime() > DAY);
  const revenueAll = L.reduce((s, o) => s + o.total, 0);
  return { today, week, month, prev, growth, pendingCount: pending.length, stale, aov: L.length ? revenueAll / L.length : 0, revenueAll, liveCount: L.length };
}

export function stockAlerts(products: Product[]) {
  const active = products.filter((p) => p.status === 'active');
  return {
    out: active.filter((p) => p.stock === 0),
    low: active.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock),
  };
}

/* ───────── customers ───────── */

export type CustomerRow = {
  key: string;
  name: string;
  whatsapp: string;
  city: string;
  country: string;
  orders: number; // non-cancelled
  spent: number; // non-cancelled
  first: string;
  last: string;
};

export function customersFrom(orders: Order[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  const sorted = [...orders].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  for (const o of sorted) {
    const key = normalizeWhatsapp(o.whatsapp) || o.whatsapp.trim() || o.id;
    const cur = map.get(key);
    const base: CustomerRow = cur ?? { key, name: o.customerName, whatsapp: o.whatsapp, city: o.city, country: o.country, orders: 0, spent: 0, first: o.createdAt, last: o.createdAt };
    // later orders overwrite contact details so we always show the most recent ones
    base.name = o.customerName || base.name;
    base.whatsapp = o.whatsapp || base.whatsapp;
    base.city = o.city || base.city;
    base.country = o.country || base.country;
    base.last = o.createdAt;
    if (o.status !== 'Cancelled') {
      base.orders += 1;
      base.spent += o.total;
    }
    map.set(key, base);
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent || +new Date(b.last) - +new Date(a.last));
}

export function filterCustomers(rows: CustomerRow[], q?: string): CustomerRow[] {
  const s = (q ?? '').trim().toLowerCase();
  if (!s) return rows;
  const d = s.replace(/\D/g, '');
  return rows.filter((r) => `${r.name} ${r.city} ${r.country} ${r.whatsapp}`.toLowerCase().includes(s) || (d.length >= 4 && r.key.includes(d)));
}

export const customersCsv = (rows: CustomerRow[]) =>
  toCsv(
    ['Name', 'WhatsApp', 'City', 'Country', 'Orders (excl. cancelled)', 'Total spent', 'First order', 'Last order'],
    rows.map((r) => [r.name, r.whatsapp, r.city, r.country, r.orders, r.spent, fmtDate(r.first), fmtDate(r.last)]),
  );

/* ───────── products ───────── */

export type ProductFilter = { q?: string; category?: string; status?: string; stock?: string; sort?: string };
export const PRODUCT_SORTS = [
  ['new', 'Newest'],
  ['name', 'Name A–Z'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['stock-asc', 'Stock: lowest first'],
] as const;

export function filterProducts(products: Product[], f: ProductFilter): Product[] {
  const q = (f.q ?? '').trim().toLowerCase();
  const out = products.filter((p) => {
    if (q && !`${p.name} ${p.sku} ${p.slug}`.toLowerCase().includes(q)) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.status === 'active' || f.status === 'draft') {
      if (p.status !== f.status) return false;
    }
    if (f.stock === 'out' && p.stock !== 0) return false;
    if (f.stock === 'low' && !(p.stock > 0 && p.stock <= LOW_STOCK)) return false;
    if (f.stock === 'in' && !(p.stock > LOW_STOCK)) return false;
    return true;
  });
  switch (f.sort) {
    case 'name': return out.sort((a, b) => a.name.localeCompare(b.name));
    case 'price-asc': return out.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case 'price-desc': return out.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case 'stock-asc': return out.sort((a, b) => a.stock - b.stock);
    default: return out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}

/** Only allow redirecting back to an /admin path (prevents open redirects through a hidden form field). */
export function safeBack(back: unknown, fallback: string): string {
  if (typeof back !== 'string') return fallback;
  if (!/^\/admin(\/|\?|$)/.test(back) || back.startsWith('//') || back.includes('\\') || /[\r\n]/.test(back)) return fallback;
  return back.slice(0, 600);
}

/** Appends ?notice= / ?error= to an admin path, keeping existing query parameters. */
export function withNotice(path: string, key: 'notice' | 'error', message: string): string {
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.delete('notice');
  params.delete('error');
  params.set(key, message.slice(0, 200));
  return `${base}?${params.toString()}`;
}

/** A single string from a Next.js search param (which may be an array or missing). */
export const qp = (v: string | string[] | undefined, max = 100): string => (typeof v === 'string' ? v.slice(0, max) : '');
export const validDay = (v: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
