import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminConfigured } from '@/lib/supabase/env';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Newsletter sign-up isn't connected yet. Please check back soon." }, { status: 503 });
  }
  if (!rateLimit(`nl:${clientIp(req)}`, 5, 60_000)) return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });

  let email = '';
  try {
    email = String((await req.json()).email ?? '').trim().toLowerCase();
  } catch {
    /* fallthrough */
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  const { error } = await createServiceClient().from('subscribers').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });
  if (error) {
    console.error('[venora] newsletter insert failed:', error.message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
