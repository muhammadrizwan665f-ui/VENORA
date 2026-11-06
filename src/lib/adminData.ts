import 'server-only';
import { createServiceClient } from './supabase/server';
import { rowToCategory, rowToProduct, rowToSettings } from './data';
import { computeKpis, customersFrom, dailySeries, statusCounts, stockAlerts } from './adminTools';
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
  adminNotes: r.admin_notes ?? '',
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

/** Reads every row of a table (PostgREST returns at most 1000 rows per request), newest first. */
async function fetchAll(table: string, orderCol: string, max = 20000): Promise<any[]> {
  const db = createServiceClient();
  const out: any[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await db.from(table).select('*').order(orderCol, { ascending: false }).order('id').range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) break;
  }
  return out;
}

export async function adminAllOrders(): Promise<Order[]> {
  return (await fetchAll('orders', 'created_at')).map(rowToOrder);
}

export async function adminOrder(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{8,40}$/i.test(id)) return null;
  const { data } = await createServiceClient().from('orders').select('*').eq('id', id).maybeSingle();
  return data ? rowToOrder(data) : null;
}

export type Subscriber = { id: string; email: string; createdAt: string };
export async function adminSubscribers(): Promise<Subscriber[]> {
  return (await fetchAll('subscribers', 'created_at')).map((r) => ({ id: String(r.id), email: r.email, createdAt: r.created_at }));
}

/** Number of orders still waiting for the admin (shown as a badge in the sidebar). Never throws. */
export async function pendingOrderCount(): Promise<number> {
  try {
    const { count } = await createServiceClient().from('orders').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Raw table contents for the full JSON backup. */
export async function adminRawBackup() {
  const db = createServiceClient();
  const [settings, categories, products, orders, subscribers] = await Promise.all([
    db.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    fetchAll('categories', 'sort'),
    fetchAll('products', 'created_at'),
    fetchAll('orders', 'created_at'),
    fetchAll('subscribers', 'created_at'),
  ]);
  return { exportedAt: new Date().toISOString(), store: 'VENORA JEWELRY', settings: settings.data ?? null, categories, products, orders, subscribers };
}

export async function dashboardStats() {
  const [products, orders] = await Promise.all([adminProducts(), adminAllOrders()]);
  const live = orders.filter((o) => o.status !== 'Cancelled');

  const sold = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of live) {
    for (const i of o.items) {
      const cur = sold.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.qty * i.price;
      sold.set(i.productId, cur);
    }
  }

  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalCustomers: customersFrom(orders).length,
    kpis: computeKpis(orders),
    days: dailySeries(orders, 14),
    alerts: stockAlerts(products),
    recent: orders.slice(0, 8),
    bestSellers: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    byStatus: statusCounts(orders),
  };
}
