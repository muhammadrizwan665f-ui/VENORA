import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminConfigured } from '@/lib/supabase/env';
import { getAllProducts, getSettings } from '@/lib/data';
import { effectivePrice, type OrderItem } from '@/lib/types';
import { shippingFor, round2 } from '@/lib/cartMath';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Records a customer's WhatsApp checkout so the owner can see it in the admin dashboard.
 * Status is ALWAYS "Pending": nothing is ever confirmed or paid automatically.
 * Prices are re-read from the catalogue here, never trusted from the browser.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ recorded: false, reason: 'not-configured' }, { status: 503 });
  if (!rateLimit(`orders:${clientIp(req)}`, 8, 60_000)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ref = str(body.ref, 20);
  const c = (body.customer ?? {}) as Record<string, unknown>;
  const customer = {
    name: str(c.name, 100),
    whatsapp: str(c.whatsapp, 30),
    country: str(c.country, 80),
    city: str(c.city, 80),
    address: str(c.address, 400),
    notes: str(c.notes, 500),
  };
  if (!/^VEN-\d{6}-[0-9A-Z]{4}$/.test(ref)) return NextResponse.json({ error: 'Bad reference' }, { status: 400 });
  if (!customer.name || customer.whatsapp.replace(/\D/g, '').length < 7 || !customer.country || !customer.city || !customer.address) {
    return NextResponse.json({ error: 'Missing customer details' }, { status: 400 });
  }
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!rawItems.length) return NextResponse.json({ error: 'Empty cart' }, { status: 400 });

  const catalogue = await getAllProducts();
  const items: OrderItem[] = [];
  for (const r of rawItems as Record<string, unknown>[]) {
    const p = catalogue.find((x) => x.id === r.productId);
    const qty = Number(r.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 99) return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
    items.push({ productId: p.id, slug: p.slug, name: p.name, price: effectivePrice(p), qty, variant: str(r.variant, 120) || undefined });
  }

  const settings = await getSettings();
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
  const shipping = shippingFor(subtotal, settings);

  const { error } = await createServiceClient()
    .from('orders')
    .insert({
      order_number: ref,
      source: 'whatsapp-cart',
      status: 'Pending',
      customer_name: customer.name,
      whatsapp: customer.whatsapp,
      country: customer.country,
      city: customer.city,
      address: customer.address,
      notes: customer.notes,
      items,
      subtotal,
      shipping,
      total: round2(subtotal + shipping),
      currency: settings.currency,
    });

  if (error && error.code !== '23505') {
    console.error('[venora] order insert failed:', error.message);
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
  return NextResponse.json({ recorded: true });
}
