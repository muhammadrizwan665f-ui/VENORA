import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminConfigured } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
const MAX_BYTES = 10 * 1024 * 1024;

/** Admin-only image upload to the public `product-images` Supabase Storage bucket. */
export async function POST(req: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File).slice(0, 10);
  if (!files.length) return NextResponse.json({ error: 'No files received.' }, { status: 400 });

  const db = createServiceClient();
  const urls: string[] = [];
  for (const file of files) {
    const ext = TYPES[file.type];
    if (!ext) return NextResponse.json({ error: `${file.name}: only JPG, PNG, WebP, AVIF or GIF images are allowed.` }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: `${file.name} is larger than 10 MB.` }, { status: 400 });
    const path = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await db.storage.from('product-images').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    urls.push(db.storage.from('product-images').getPublicUrl(path).data.publicUrl);
  }
  return NextResponse.json({ urls });
}
