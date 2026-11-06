import Link from 'next/link';
import { adminSettings, dashboardStats } from '@/lib/adminData';
import { fmtDateTime, LOW_STOCK } from '@/lib/adminTools';
import { importSampleCatalogue } from '../actions';
import { money } from '@/lib/whatsapp';

export default async function Dashboard() {
  const [s, settings] = await Promise.all([dashboardStats(), adminSettings()]);
  const sym = settings.currencySymbol;
  const k = s.kpis;
  const max = Math.max(1, ...s.days.map((d) => d.revenue));
  const W = 560, H = 160, bw = W / s.days.length;
  const growth = k.growth === null ? 'no earlier data yet' : `${k.growth >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(k.growth))}% vs previous 30 days`;

  const money4: [string, string, string][] = [
    ['Revenue today', money(k.today.revenue, sym), `${k.today.orders} order${k.today.orders === 1 ? '' : 's'}`],
    ['Last 7 days', money(k.week.revenue, sym), `${k.week.orders} orders`],
    ['Last 30 days', money(k.month.revenue, sym), growth],
    ['Average order', money(k.aov, sym), `${k.liveCount} orders, excl. cancelled`],
  ];
  const counts: [string, string, string][] = [
    ['Pending orders', String(k.pendingCount), '/admin/orders?status=Pending'],
    ['Total orders', String(s.totalOrders), '/admin/orders'],
    ['Products', String(s.totalProducts), '/admin/products'],
    ['Customers', String(s.totalCustomers), '/admin/customers'],
  ];
  const needsAttention = k.stale.length > 0 || s.alerts.out.length > 0 || s.alerts.low.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-gold">Dashboard</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/admin/products/new" className="btn-gold !py-2">+ Add product</Link>
          <Link href="/admin/orders#new-order" className="btn-outline !py-2">+ New order</Link>
          <a href="/api/admin/export?type=orders" className="btn-outline !py-2">Export orders</a>
        </div>
      </div>

      {s.totalProducts === 0 && (
        <form action={importSampleCatalogue} className="rounded-2xl border border-gold/40 bg-coal p-5">
          <p className="text-sm text-ivory/85">Your catalogue is empty. Import the 6 categories and 12 sample serpent products to get started (you can edit or delete them afterwards).</p>
          <button className="btn-gold mt-3">Import sample catalogue</button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {money4.map(([l, v, sub]) => (
          <div key={l} className="rounded-2xl border border-gold/25 bg-coal p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{l}</p>
            <p className="gold-text mt-2 font-serif text-3xl">{v}</p>
            <p className="mt-1 text-xs text-mute">{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counts.map(([l, v, href]) => (
          <Link key={l} href={href} className="rounded-2xl border border-gold/25 bg-coal p-5 transition hover:border-gold/70">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{l}</p>
            <p className="mt-2 font-serif text-3xl text-ivory">{v}</p>
          </Link>
        ))}
      </div>

      {needsAttention && (
        <section className="rounded-2xl border border-gold/40 bg-coal p-5" aria-label="Needs attention">
          <h2 className="font-serif text-xl text-ivory">Needs your attention</h2>
          <div className="mt-3 grid gap-6 text-sm md:grid-cols-2">
            {k.stale.length > 0 && (
              <div>
                <p className="label-lux">Pending for more than 24 hours ({k.stale.length})</p>
                <ul className="space-y-1.5">
                  {k.stale.slice(0, 6).map((o) => (
                    <li key={o.id}><Link href={`/admin/orders?q=${encodeURIComponent(o.orderNumber)}`} className="text-gold underline underline-offset-4">{o.orderNumber}</Link> <span className="text-mute">· {o.customerName} · {fmtDateTime(o.createdAt)}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {(s.alerts.out.length > 0 || s.alerts.low.length > 0) && (
              <div>
                <p className="label-lux">Stock alerts (low = {LOW_STOCK} or fewer)</p>
                <ul className="space-y-1.5">
                  {s.alerts.out.slice(0, 6).map((p) => (
                    <li key={p.id}><Link href={`/admin/products/${p.id}`} className="text-gold underline underline-offset-4">{p.name}</Link> <span className="text-red-400">· out of stock</span></li>
                  ))}
                  {s.alerts.low.slice(0, 6).map((p) => (
                    <li key={p.id}><Link href={`/admin/products/${p.id}`} className="text-gold underline underline-offset-4">{p.name}</Link> <span className="text-mute">· only {p.stock} left</span></li>
                  ))}
                </ul>
                {s.alerts.out.length + s.alerts.low.length > 12 && <Link href="/admin/products?stock=low" className="mt-2 inline-block text-xs text-gold underline underline-offset-4">See all low stock</Link>}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gold/25 bg-coal p-5">
        <h2 className="font-serif text-xl text-ivory">Sales overview · last 14 days</h2>
        <svg viewBox={`0 0 ${W} ${H + 24}`} className="mt-4 w-full" role="img" aria-label="Daily revenue for the last 14 days">
          {s.days.map((d, i) => {
            const h = (d.revenue / max) * H;
            return (
              <g key={d.day}>
                <rect x={i * bw + 6} y={H - h} width={bw - 12} height={Math.max(h, 1)} rx="3" style={{ fill: 'rgb(var(--c-gold))' }} opacity={d.revenue ? 1 : 0.2}>
                  <title>{`${d.day}: ${money(d.revenue, sym)} (${d.orders} orders)`}</title>
                </rect>
                <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="9" style={{ fill: 'rgb(var(--c-mute))' }}>{d.day.slice(8)}</text>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-xs text-mute">Revenue = order totals recorded here (cancelled orders excluded); it is not payment confirmation. Days follow Pakistan time.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-gold/25 bg-coal p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-xl">Recent orders</h2><Link href="/admin/orders" className="text-sm text-gold underline underline-offset-4">All orders</Link></div>
          {s.recent.length === 0 ? <p className="text-sm text-mute">No orders recorded yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-mute"><tr><th className="py-2">Order</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {s.recent.map((o) => (
                    <tr key={o.id} className="border-t border-gold/10"><td className="py-2.5"><Link href={`/admin/orders?q=${encodeURIComponent(o.orderNumber)}`} className="text-gold">{o.orderNumber}</Link></td><td>{o.customerName}</td><td>{o.status}</td><td className="text-right">{money(o.total, sym)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-gold/25 bg-coal p-5">
          <h2 className="mb-3 font-serif text-xl">Best sellers</h2>
          {s.bestSellers.length === 0 ? <p className="text-sm text-mute">Appears once orders are recorded.</p> : (
            <ol className="space-y-3 text-sm">
              {s.bestSellers.map((b, i) => (
                <li key={b.name} className="flex justify-between gap-3"><span><span className="text-gold">{i + 1}.</span> {b.name}</span><span className="text-mute">{b.qty} sold</span></li>
              ))}
            </ol>
          )}
          <h3 className="mb-2 mt-6 text-xs uppercase tracking-wider text-mute">Orders by status</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(s.byStatus).map(([k2, v]) => <li key={k2} className="flex justify-between"><Link href={`/admin/orders?status=${k2}`} className="hover:text-gold">{k2}</Link><span>{v}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
