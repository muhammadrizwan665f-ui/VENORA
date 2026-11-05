import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminConfigured } from '@/lib/supabase/env';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/** Order lookup needs BOTH the order reference and the WhatsApp number used on the order. */
export async function POST(req: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  if (!rateLimit(`track:${clientIp(req)}`, 10, 60_000)) return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });

  let ref = '';
  let phone = '';
  try {
    const b = await req.json();
    ref = String(b.orderNumber ?? '').trim().toUpperCase().slice(0, 20);
    phone = String(b.whatsapp ?? '').replace(/\D/g, '');
  } catch {
    /* fallthrough */
  }
  const notFound = () => NextResponse.json({ found: false }, { status: 200 });
  if (!/^VEN-\d{6}-[0-9A-Z]{4}$/.test(ref) || phone.length < 7) return notFound();

  const { data } = await createServiceClient()
    .from('orders')
    .select('order_number, status, whatsapp, total, currency, created_at, items')
    .eq('order_number', ref)
    .maybeSingle();
  if (!data) return notFound();

  // Compare the trailing digits so +92 / 0092 / 0 formats all match.
  const tail = (s: string) => s.replace(/\D/g, '').slice(-9);
  if (tail(data.whatsapp) !== tail(phone)) return notFound();

  return NextResponse.json({
    found: true,
    orderNumber: data.order_number,
    status: data.status,
    total: Number(data.total),
    currency: data.currency,
    placedAt: data.created_at,
    itemCount: Array.isArray(data.items) ? data.items.reduce((n: number, i: { qty?: number }) => n + (i.qty || 0), 0) : 0,
  });
}
