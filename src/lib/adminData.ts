import 'server-only';
import { createServiceClient } from './supabase/server';
import { rowToCategory, rowToProduct, rowToSettings } from './data';
import { normalizeWhatsapp } from './whatsapp';
import { defaultSettings } from './seed';
import type { Category, Order, OrderItem, OrderStatus, Product, StoreSettings } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const rowToOrder = (r: any): Order => ({
  id: String(r.id),
  orderNumber: r.order_number,
  source: r.source === 'manual' ? 'manual' : 'whatsapp-cart',
  status: r.status as OrderStatus,
  customerName: r.customer_name,
  whatsapp: r.whatsapp,
  country: r.country ?? '',
  city: r.city ?? '',
  address: r.address ?? '',
  notes: r.notes ?? '',
  items: (Array.isArray(r.items) ? r.items : []) as OrderItem[],
  subtotal: Number(r.subtotal),
  shipping: Number(r.shipping),
  total: Number(r.total),
  currency: r.currency ?? 'USD',
  createdAt: r.created_at,
});

export async function adminProducts(): Promise<Product[]> {
  const { data, error } = await createServiceClient().from('products').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToProduct);
}

export async function adminProduct(id: string): Promise<Product | null> {
  const { data } = await createServiceClient().from('products').select('*').eq('id', id).maybeSingle();
  return data ? rowToProduct(data) : null;
}

export async function adminCategories(): Promise<Category[]> {
  const { data, error } = await createServiceClient().from('categories').select('*').order('sort');
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToCategory);
}

export async function adminSettings(): Promise<StoreSettings> {
  const { data } = await createServiceClient().from('store_settings').select('*').eq('id', 1).maybeSingle();
  return data ? rowToSettings(data) : defaultSettings;
}

export async function adminOrders(status?: string, limit = 200): Promise<Order[]> {
  let q = createServiceClient().from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToOrder);
}

export type DayPoint = { day: string; revenue: number; orders: number };

export async function dashboardStats() {
  const db = createServiceClient();
  const [products, orderCount, orderRows] = await Promise.all([
    db.from('products').select('*', { count: 'exact', head: true }),
    db.from('orders').select('*', { count: 'exact', head: true }),
    db.from('orders').select('*').order('created_at', { ascending: false }).limit(5000),
  ]);
  const orders = (orderRows.data ?? []).map(rowToOrder);
  const live = orders.filter((o) => o.status !== 'Cancelled');

  const customers = new Set(orders.map((o) => normalizeWhatsapp(o.whatsapp).slice(-9) || o.whatsapp)).size;
  const revenue = live.reduce((s, o) => s + o.total, 0);

  // last 14 days
  const days: DayPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ day: d.toISOString().slice(0, 10), revenue: 0, orders: 0 });
  }
  for (const o of live) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    const slot = days.find((d) => d.day === key);
    if (slot) {
      slot.revenue += o.total;
      slot.orders += 1;
    }
  }

  const sold = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of live) {
    for (const i of o.items) {
      const cur = sold.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.qty * i.price;
      sold.set(i.productId, cur);
    }
  }
  const bestSellers = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  return {
    totalProducts: products.count ?? 0,
    totalOrders: orderCount.count ?? orders.length,
    totalCustomers: customers,
    revenue,
    recent: orders.slice(0, 8),
    days,
    bestSellers,
    byStatus,
  };
}
