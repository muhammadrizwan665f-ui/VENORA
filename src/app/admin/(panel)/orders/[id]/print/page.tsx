import Link from 'next/link';
import { notFound } from 'next/navigation';
import PrintButton from '@/components/admin/PrintButton';
import { adminOrder, adminSettings } from '@/lib/adminData';
import { fmtDateTime } from '@/lib/adminTools';
import { money } from '@/lib/whatsapp';

/** Printable invoice, or packing slip (no prices) with ?mode=packing. */
export default async function PrintOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mode?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [order, s] = await Promise.all([adminOrder(id), adminSettings()]);
  if (!order) notFound();
  const packing = sp.mode === 'packing';
  const sym = s.currencySymbol;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton label={packing ? 'Print packing slip' : 'Print invoice'} />
        <Link href={`/admin/orders/${order.id}/print${packing ? '' : '?mode=packing'}`} className="text-sm text-gold underline underline-offset-4">{packing ? 'Switch to invoice' : 'Switch to packing slip'}</Link>
        <Link href={`/admin/orders?q=${encodeURIComponent(order.orderNumber)}`} className="text-sm text-mute underline underline-offset-4">Back to orders</Link>
      </div>

      <article className="rounded-2xl bg-white p-8 text-black shadow-xl print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-300 pb-5">
          <div>
            <p className="font-serif text-3xl tracking-[0.2em]">{s.storeName}</p>
            {s.tagline && <p className="text-sm text-neutral-600">{s.tagline}</p>}
            <p className="mt-2 text-xs text-neutral-600">
              {[s.address, s.phone || `+${s.whatsappNumber}`, s.email].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-semibold uppercase tracking-widest">{packing ? 'Packing slip' : 'Invoice'}</p>
            <p>{order.orderNumber}</p>
            <p className="text-neutral-600">{fmtDateTime(order.createdAt)}</p>
            <p className="text-neutral-600">Status: {order.status}</p>
          </div>
        </header>

        <section className="grid gap-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">Ship to</p>
            <p className="font-medium">{order.customerName}</p>
            <p>{order.whatsapp}</p>
            <p>{[order.city, order.country].filter(Boolean).join(', ')}</p>
            <p className="whitespace-pre-line">{order.address}</p>
          </div>
          {order.notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">Customer note</p>
              <p className="whitespace-pre-line">{order.notes}</p>
            </div>
          )}
        </section>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-neutral-300 text-xs uppercase tracking-wider text-neutral-500">
              <th className="py-2">Item</th>
              <th className="w-16 text-center">Qty</th>
              {!packing && <th className="w-24 text-right">Price</th>}
              {!packing && <th className="w-28 text-right">Amount</th>}
              {packing && <th className="w-16 text-center">Packed</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, k) => (
              <tr key={k} className="border-b border-neutral-200">
                <td className="py-2.5">{i.name}{i.variant ? <span className="text-neutral-600"> ({i.variant})</span> : null}</td>
                <td className="text-center">{i.qty}</td>
                {!packing && <td className="text-right">{money(i.price, sym)}</td>}
                {!packing && <td className="text-right">{money(i.price * i.qty, sym)}</td>}
                {packing && <td className="text-center">☐</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {!packing && (
          <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-600">Subtotal</dt><dd>{money(order.subtotal, sym)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-600">Shipping</dt><dd>{order.shipping > 0 ? money(order.shipping, sym) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-neutral-300 pt-2 text-base font-semibold"><dt>Total</dt><dd>{money(order.total, sym)}</dd></div>
          </dl>
        )}
        <p className="mt-8 text-center text-xs text-neutral-500">Thank you for choosing {s.storeName}.{!packing && ' This document is an order summary, not a payment receipt.'}</p>
      </article>
    </div>
  );
}
