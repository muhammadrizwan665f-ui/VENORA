import Link from 'next/link';
import ManualOrderForm from '@/components/admin/ManualOrderForm';
import { adminOrders, adminProducts, adminSettings } from '@/lib/adminData';
import { ORDER_STATUSES } from '@/lib/types';
import { money, waLink } from '@/lib/whatsapp';
import { deleteOrder, updateOrderStatus } from '../../actions';

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status ?? '') ? sp.status : undefined;
  const [orders, products, settings] = await Promise.all([adminOrders(status), adminProducts(), adminSettings()]);
  const sym = settings.currencySymbol;
  const pill = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-xs ${on ? 'border-gold bg-gold text-ink' : 'border-gold/30 text-ivory/90 hover:border-gold'}`;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-gold">Orders</h1>
      <p className="max-w-2xl text-sm text-mute">Checkouts customers send via WhatsApp are recorded here as <strong className="text-ivory/90">Pending</strong> (when the site is connected to Supabase). Nothing is confirmed or paid automatically: you update the status yourself after speaking with the customer.</p>
      <ManualOrderForm products={products.map((p) => ({ id: p.id, name: p.name }))} />
      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        <Link href="/admin/orders" className={pill(!status)}>All</Link>
        {ORDER_STATUSES.map((s) => <Link key={s} href={`/admin/orders?status=${s}`} className={pill(status === s)}>{s}</Link>)}
      </nav>

      {orders.length === 0 && <p className="text-mute">No orders{status ? ` with status “${status}”` : ''}.</p>}
      <div className="space-y-3">
        {orders.map((o) => (
          <details key={o.id} className="rounded-2xl border border-gold/25 bg-coal">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
              <span className="font-medium text-gold">{o.orderNumber}</span>
              <span>{o.customerName}</span>
              <span className="text-mute">{new Date(o.createdAt).toLocaleString()}</span>
              <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs">{o.status}</span>
              <span className="ml-auto font-semibold">{money(o.total, sym)}</span>
            </summary>
            <div className="grid gap-6 border-t border-gold/15 p-4 md:grid-cols-2">
              <div className="space-y-1 text-sm">
                <p className="label-lux">Customer</p>
                <p>{o.customerName}</p>
                <p>{o.whatsapp} · <a className="text-gold underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={waLink(o.whatsapp, `Hello ${o.customerName}, this is VENORA JEWELRY regarding your order ${o.orderNumber}.`)}>Message on WhatsApp</a></p>
                <p>{[o.city, o.country].filter(Boolean).join(', ')}</p>
                <p className="whitespace-pre-line text-ivory/80">{o.address}</p>
                {o.notes && <p className="text-ivory/80">Notes: {o.notes}</p>}
                <p className="pt-1 text-xs text-mute">Source: {o.source === 'manual' ? 'manual entry' : 'WhatsApp checkout'}</p>
              </div>
              <div className="text-sm">
                <p className="label-lux">Items</p>
                <ul className="space-y-1">
                  {o.items.map((i, k) => <li key={k} className="flex justify-between gap-3"><span>{i.qty} × {i.name}{i.variant ? ` (${i.variant})` : ''}</span><span>{money(i.price * i.qty, sym)}</span></li>)}
                </ul>
                <dl className="mt-3 space-y-1 border-t border-gold/15 pt-3">
                  <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{money(o.subtotal, sym)}</dd></div>
                  <div className="flex justify-between"><dt className="text-mute">Shipping</dt><dd>{o.shipping > 0 ? money(o.shipping, sym) : 'Free'}</dd></div>
                  <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{money(o.total, sym)}</dd></div>
                </dl>
              </div>
              <form action={updateOrderStatus} className="flex flex-wrap items-center gap-3 md:col-span-2">
                <input type="hidden" name="id" value={o.id} />
                <label className="sr-only" htmlFor={`st-${o.id}`}>Status</label>
                <select id={`st-${o.id}`} name="status" defaultValue={o.status} className="input-lux !w-auto">{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                <button className="btn-gold !py-2">Update status</button>
                <button formAction={deleteOrder} className="ml-auto text-xs text-red-400 underline underline-offset-4">Delete order</button>
              </form>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
