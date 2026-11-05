import { NextResponse } from 'next/server';
import { getAllProducts, getProducts } from '@/lib/data';
import { toSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products?q=term          → search
 * GET /api/products?slugs=a,b,c     → fresh data for specific products (cart / wishlist price refresh)
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  const slugs = (params.get('slugs') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 60);
  if (slugs.length) {
    const all = await getAllProducts();
    return NextResponse.json(all.filter((p) => slugs.includes(p.slug)).map(toSummary));
  }

  const q = (params.get('q') || '').trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json([]);
  const list = await getProducts({ q, limit: 12 });
  return NextResponse.json(list.map(toSummary));
}
