import Link from 'next/link';
import ManualOrderForm from '@/components/admin/ManualOrderForm';
import ConfirmButton from '@/components/admin/ConfirmButton';
import Notice from '@/components/admin/Notice';
import SelectAll from '@/components/admin/SelectAll';
import { adminAllOrders, adminProducts, adminSettings } from '@/lib/adminData';
import { filterOrders, fmtDateTime, qp, statusCounts, statusMessage, validDay } from '@/lib/adminTools';
import { ORDER_STATUSES } from '@/lib/types';
import { money, waLink } from '@/lib/whatsapp';
import { bulkUpdateOrderStatus, deleteOrder, saveOrderNote, updateOrderStatus } from '../../actions';

const SHOW = 100;
type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function OrdersAdmin({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = qp(sp.q, 80);
  const from = validDay(qp(sp.from, 10));
  const to = validDay(qp(sp.to, 10));
  const rawStatus = qp(sp.status, 20);
  const status = (ORDER_STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : '';

  const [all, products, settings] = await Promise.all([adminAllOrders(), adminProducts(), adminSettings()]);
  const sym = settings.currencySymbol;
  const base = filterOrders(all, { q, from, to }, { ignoreStatus: true });
  const counts = statusCounts(base);
  const filtered = status ? base.filter((o) => o.status === status) : base;
  const shown = filtered.slice(0, SHOW);

  const params = (over: Record<string, string> = {}) => {
    const p = new URLSearchParams();
    const m: Record<string, string> = { q, status, from, to, ...over };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v);
    return p;
  };
  const qs = (over: Record<string, string> = {}) => {
    const s = params(over).toString();
    return s ? `?${s}` : '';
  };
  const csvHref = `/api/admin/export?${new URLSearchParams({ type: 'orders', ...Object.fromEntries(params()) }).toString()}`;
  const back = `/admin/orders${qs()}`;
  const filtersOn = Boolean(q || from || to || status);
  const pill = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-xs ${on ? 'border-gold bg-gold text-ink' : 'border-gold/30 text-ivory/90 hover:border-gold'}`;
  const store = settings.storeName;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-gold">Orders</h1>
      <Notice notice={qp(sp.notice, 200)} error={qp(sp.error, 200)} />
      <p className="max-w-2xl text-sm text-mute">Checkouts customers send via WhatsApp are recorded here as <strong className="text-ivory/90">Pending</strong> (when the site is connected to Supabase). Nothing is confirmed or paid automatically: you update the status yourself after speaking with the customer.</p>
      <div id="new-order"><ManualOrderForm products={products.map((p) => ({ id: p.id, name: p.name }))} /></div>

      <form method="get" className="grid gap-3 rounded-2xl border border-gold/25 bg-coal p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]" role="search">
        <div>
          <label htmlFor="oq" className="label-lux">Search</label>
          <input id="oq" name="q" defaultValue={q} placeholder="Order no., name, phone, city…" className="input-lux" />
        </div>
        <div>
          <label htmlFor="of" className="label-lux">From</label>
          <input id="of" type="date" name="from" defaultValue={from} className="input-lux" />
        </div>
        <div>
          <label htmlFor="ot" className="label-lux">To</label>
          <input id="ot" type="date" name="to" defaultValue={to} className="input-lux" />
        </div>
        <div className="flex items-end gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <button className="btn-gold !py-2.5">Filter</button>
          {filtersOn && <Link href="/admin/orders" className="px-2 py-2.5 text-xs text-mute underline underline-offset-4">Reset</Link>}
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
          <Link href={`/admin/orders${qs({ status: '' })}`} className={pill(!status)}>All ({base.length})</Link>
          {ORDER_STATUSES.map((s) => <Link key={s} href={`/admin/orders${qs({ status: s })}`} className={pill(status === s)}>{s} ({counts[s] ?? 0})</Link>)}
        </nav>
        <a href={csvHref} className="btn-outline !py-2 text-xs">Download CSV ({filtered.length})</a>
      </div>

      {shown.length > 0 && (
        <form id="bulk-orders" action={bulkUpdateOrderStatus} className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/20 bg-coal px-4 py-3">
          <input type="hidden" name="back" value={back} />
          <SelectAll form="bulk-orders" label="Select all shown" />
          <label className="sr-only" htmlFor="bulk-status">Set selected orders to</label>
          <select id="bulk-status" name="status" defaultValue="Confirmed" className="input-lux !w-auto !py-1.5 text-sm">{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <button className="btn-gold !py-1.5 text-xs">Apply to selected</button>
        </form>
      )}

      {filtered.length === 0 && <p className="text-mute">No orders{filtersOn ? ' match these filters' : ' yet'}.</p>}
      {filtered.length > SHOW && <p className="text-xs text-mute">Showing the newest {SHOW} of {filtered.length}. Narrow the search or download the CSV for everything.</p>}
      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o.id} className="flex items-start gap-3">
            <input type="checkbox" form="bulk-orders" name="ids" value={o.id} aria-label={`Select order ${o.orderNumber}`} className="mt-5 h-4 w-4 shrink-0 accent-[rgb(var(--c-gold))]" />
            <details className="min-w-0 flex-1 rounded-2xl border border-gold/25 bg-coal">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
                <span className="font-medium text-gold">{o.orderNumber}</span>
                <span>{o.customerName}</span>
                <span className="text-mute">{fmtDateTime(o.createdAt)}</span>
                <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs">{o.status}</span>
                <span className="ml-auto font-semibold">{money(o.total, sym)}</span>
              </summary>
              <div className="grid gap-6 border-t border-gold/15 p-4 md:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <p className="label-lux">Customer</p>
                  <p>{o.customerName}</p>
                  <p>{o.whatsapp}</p>
                  <p>{[o.city, o.country].filter(Boolean).join(', ')}</p>
                  <p className="whitespace-pre-line text-ivory/80">{o.address}</p>
                  {o.notes && <p className="text-ivory/80">Customer note: {o.notes}</p>}
                  <p className="pt-1 text-xs text-mute">Source: {o.source === 'manual' ? 'manual entry' : 'WhatsApp checkout'}</p>
                  <p className="label-lux !mt-4">Message on WhatsApp</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {([['hello', 'Say hello'], ['confirm', 'Order confirmed'], ['shipped', 'Shipped'], ['delivered', 'Delivered']] as const).map(([kind, label]) => (
                      <a key={kind} target="_blank" rel="noopener noreferrer" href={waLink(o.whatsapp, statusMessage(o, kind, store, sym))} className="rounded-full border border-gold/40 px-3 py-1.5 text-gold hover:bg-gold/10">{label}</a>
                    ))}
                  </div>
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
                  <p className="mt-3 flex flex-wrap gap-4 text-xs">
                    <Link href={`/admin/orders/${o.id}/print`} target="_blank" className="text-gold underline underline-offset-4">Print invoice</Link>
                    <Link href={`/admin/orders/${o.id}/print?mode=packing`} target="_blank" className="text-gold underline underline-offset-4">Print packing slip</Link>
                  </p>
                </div>
                <form action={saveOrderNote} className="md:col-span-2">
                  <input type="hidden" name="id" value={o.id} />
                  <label htmlFor={`an-${o.id}`} className="label-lux">Private notes (only you see these)</label>
                  <div className="flex flex-wrap items-start gap-3">
                    <textarea id={`an-${o.id}`} name="admin_notes" rows={2} maxLength={1000} defaultValue={o.adminNotes} placeholder="e.g. customer wants gift wrap, paid via bank transfer, courier tracking no…" className="input-lux min-w-[220px] flex-1" />
                    <button className="btn-outline !py-2.5 text-xs">Save note</button>
                  </div>
                </form>
                <form action={updateOrderStatus} className="flex flex-wrap items-center gap-3 md:col-span-2">
                  <input type="hidden" name="id" value={o.id} />
                  <label className="sr-only" htmlFor={`st-${o.id}`}>Status</label>
                  <select id={`st-${o.id}`} name="status" defaultValue={o.status} className="input-lux !w-auto">{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                  <button className="btn-gold !py-2">Update status</button>
                  <ConfirmButton formAction={deleteOrder} message={`Delete order ${o.orderNumber} permanently?`} className="ml-auto text-xs text-red-400 underline underline-offset-4">Delete order</ConfirmButton>
                </form>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
