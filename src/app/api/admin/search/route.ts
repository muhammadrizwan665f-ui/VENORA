import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminConfigured } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

/** Admin-only quick search used by the Ctrl+K command palette (products + orders). */
export async function GET(req: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ products: [], orders: [] });
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // keep only letters, digits, space and a few safe symbols: the value is placed inside a PostgREST filter
  const q = (new URL(req.url).searchParams.get('q') ?? '').replace(/[^\p{L}\p{N}\s\-_.#]/gu, '').trim().slice(0, 40);
  if (q.length < 2) return NextResponse.json({ products: [], orders: [] });

  const db = createServiceClient();
  const [products, orders] = await Promise.all([
    db.from('products').select('id, name, sku, status').or(`name.ilike.%${q}%,sku.ilike.%${q}%`).limit(6),
    db.from('orders').select('id, order_number, customer_name, status, total').or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,whatsapp.ilike.%${q}%`).limit(6),
  ]);
  return NextResponse.json({
    products: (products.data ?? []).map((p) => ({ id: p.id, name: p.name, sku: p.sku, status: p.status })),
    orders: (orders.data ?? []).map((o) => ({ id: o.id, number: o.order_number, customer: o.customer_name, status: o.status, total: Number(o.total) })),
  });
}
