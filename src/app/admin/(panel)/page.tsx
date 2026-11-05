import Link from 'next/link';
import { dashboardStats } from '@/lib/adminData';
import { adminSettings } from '@/lib/adminData';
import { importSampleCatalogue } from '../actions';
import { money } from '@/lib/whatsapp';

export default async function Dashboard() {
  const [s, settings] = await Promise.all([dashboardStats(), adminSettings()]);
  const sym = settings.currencySymbol;
  const max = Math.max(1, ...s.days.map((d) => d.revenue));
  const W = 560, H = 160, bw = W / s.days.length;

  const cards = [
    ['Total Products', String(s.totalProducts)],
    ['Total Orders', String(s.totalOrders)],
    ['Total Customers', String(s.totalCustomers)],
    ['Revenue (excl. cancelled)', money(s.revenue, sym)],
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-4xl text-gold">Dashboard</h1>

      {s.totalProducts === 0 && (
        <form action={importSampleCatalogue} className="rounded-2xl border border-gold/40 bg-coal p-5">
          <p className="text-sm text-ivory/85">Your catalogue is empty. Import the 6 categories and 12 sample serpent products to get started (you can edit or delete them afterwards).</p>
          <button className="btn-gold mt-3">Import sample catalogue</button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-gold/25 bg-coal p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{l}</p>
            <p className="gold-text mt-2 font-serif text-3xl">{v}</p>
          </div>
        ))}
      </div>

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
        <p className="mt-2 text-xs text-mute">Revenue = order totals recorded here; it is not payment confirmation.</p>
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
                    <tr key={o.id} className="border-t border-gold/10"><td className="py-2.5 text-gold">{o.orderNumber}</td><td>{o.customerName}</td><td>{o.status}</td><td className="text-right">{money(o.total, sym)}</td></tr>
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
            {Object.entries(s.byStatus).map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
