import Link from 'next/link';
import { adminAllOrders, adminSettings } from '@/lib/adminData';
import { customersFrom, filterCustomers, fmtDate, qp } from '@/lib/adminTools';
import { money, waLink } from '@/lib/whatsapp';

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CustomersAdmin({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = qp(sp.q, 80);
  const [orders, settings] = await Promise.all([adminAllOrders(), adminSettings()]);
  const everyone = customersFrom(orders);
  const rows = filterCustomers(everyone, q);
  const sym = settings.currencySymbol;
  const repeat = everyone.filter((c) => c.orders >= 2).length;
  const spent = everyone.reduce((s, c) => s + c.spent, 0);
  const exportHref = `/api/admin/export?${new URLSearchParams({ type: 'customers', ...(q ? { q } : {}) }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-gold">Customers</h1>
        <a href={exportHref} className="btn-outline !py-2 text-xs">Download CSV ({rows.length})</a>
      </div>
      <p className="max-w-2xl text-sm text-mute">Built automatically from your orders and grouped by WhatsApp number. Totals exclude cancelled orders.</p>

      <div className="grid grid-cols-3 gap-3">
        {([['Customers', String(everyone.length)], ['Repeat buyers', String(repeat)], ['Lifetime sales', money(spent, sym)]] as const).map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-gold/25 bg-coal p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{l}</p>
            <p className="gold-text mt-1 font-serif text-2xl">{v}</p>
          </div>
        ))}
      </div>

      <form method="get" role="search" className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="cq" className="label-lux">Search</label>
          <input id="cq" name="q" defaultValue={q} placeholder="Name, phone, city, country…" className="input-lux" />
        </div>
        <button className="btn-gold !py-2.5">Search</button>
        {q && <Link href="/admin/customers" className="py-2.5 text-xs text-mute underline underline-offset-4">Reset</Link>}
      </form>

      {rows.length === 0 ? (
        <p className="text-mute">{everyone.length === 0 ? 'No customers yet. They appear once orders are recorded.' : 'No customers match your search.'}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold/25 bg-coal">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-mute"><tr><th className="p-3">Customer</th><th>WhatsApp</th><th>Location</th><th className="text-right">Orders</th><th className="text-right">Spent</th><th className="pl-4">Last order</th><th /></tr></thead>
            <tbody>
              {rows.slice(0, 300).map((c) => (
                <tr key={c.key} className="border-t border-gold/10">
                  <td className="p-3">{c.name}{c.orders >= 2 && <span className="ml-2 rounded-full border border-gold/40 px-2 py-0.5 text-[10px] text-gold">repeat</span>}</td>
                  <td className="text-mute">{c.whatsapp}</td>
                  <td className="text-mute">{[c.city, c.country].filter(Boolean).join(', ') || '–'}</td>
                  <td className="text-right">{c.orders}</td>
                  <td className="text-right">{money(c.spent, sym)}</td>
                  <td className="pl-4 text-mute">{fmtDate(c.last)}</td>
                  <td className="whitespace-nowrap pr-3 text-right text-xs">
                    <a target="_blank" rel="noopener noreferrer" href={waLink(c.whatsapp, `Hello ${c.name}, this is ${settings.storeName}.`)} className="text-gold underline underline-offset-4">WhatsApp</a>
                    <Link href={`/admin/orders?q=${encodeURIComponent(c.key)}`} className="ml-3 text-gold underline underline-offset-4">Orders</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 300 && <p className="text-xs text-mute">Showing the top 300 of {rows.length}. Download the CSV for everyone.</p>}
    </div>
  );
}
