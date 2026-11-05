import Link from 'next/link';
import { adminProducts, adminSettings } from '@/lib/adminData';
import { effectivePrice } from '@/lib/types';
import { money } from '@/lib/whatsapp';

export default async function ProductsAdmin() {
  const [products, settings] = await Promise.all([adminProducts(), adminSettings()]);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-gold">Products</h1>
        <Link href="/admin/products/new" className="btn-gold">+ Add product</Link>
      </div>
      {products.length === 0 ? (
        <p className="text-mute">No products yet. Add one, or import the sample catalogue from the Dashboard.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold/25 bg-coal">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-mute"><tr><th className="p-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gold/10">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images[0] && <img src={p.images[0]} alt="" className="h-11 w-11 rounded-md object-cover" />}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>{money(effectivePrice(p), settings.currencySymbol)}{effectivePrice(p) < p.price && <span className="ml-1 text-xs text-mute line-through">{money(p.price, settings.currencySymbol)}</span>}</td>
                  <td className={p.stock === 0 ? 'text-red-400' : ''}>{p.stock}</td>
                  <td>{p.status}</td>
                  <td className="pr-3 text-right"><Link href={`/admin/products/${p.id}`} className="text-gold underline underline-offset-4">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
