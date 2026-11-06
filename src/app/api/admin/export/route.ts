import { getAdminEmail } from '@/lib/auth';
import { isAdminConfigured } from '@/lib/supabase/env';
import { adminAllOrders, adminProducts, adminRawBackup, adminSubscribers } from '@/lib/adminData';
import { customersCsv, customersFrom, dayKey, filterCustomers, filterOrders, filterProducts, ordersCsv, productsCsv, toCsv, fmtDateTime } from '@/lib/adminTools';

export const dynamic = 'force-dynamic';

const file = (body: string, name: string, type: string) =>
  new Response(body, {
    headers: {
      'Content-Type': `${type}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

/** Admin-only downloads: orders / products / customers / subscribers as CSV, or a full JSON backup. */
export async function GET(req: Request) {
  if (!isAdminConfigured()) return new Response('Supabase is not configured.', { status: 503 });
  if (!(await getAdminEmail())) return new Response('Unauthorized', { status: 401 });

  const sp = new URL(req.url).searchParams;
  const type = sp.get('type');
  const stamp = dayKey(new Date());
  const g = (k: string) => sp.get(k) ?? undefined;

  try {
    switch (type) {
      case 'orders':
        return file(ordersCsv(filterOrders(await adminAllOrders(), { q: g('q'), status: g('status'), from: g('from'), to: g('to') })), `venora-orders-${stamp}.csv`, 'text/csv');
      case 'products':
        return file(productsCsv(filterProducts(await adminProducts(), { q: g('q'), category: g('category'), status: g('status'), stock: g('stock'), sort: g('sort') })), `venora-products-${stamp}.csv`, 'text/csv');
      case 'customers':
        return file(customersCsv(filterCustomers(customersFrom(await adminAllOrders()), g('q'))), `venora-customers-${stamp}.csv`, 'text/csv');
      case 'subscribers':
        return file(toCsv(['Email', 'Subscribed'], (await adminSubscribers()).map((s) => [s.email, fmtDateTime(s.createdAt)])), `venora-subscribers-${stamp}.csv`, 'text/csv');
      case 'backup':
        return file(JSON.stringify(await adminRawBackup(), null, 2), `venora-backup-${stamp}.json`, 'application/json');
      default:
        return new Response('Unknown export type.', { status: 400 });
    }
  } catch (e) {
    return new Response(`Export failed: ${(e as Error).message}`, { status: 500 });
  }
}
