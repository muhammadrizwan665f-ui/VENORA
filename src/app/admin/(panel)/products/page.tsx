import Link from 'next/link';
import ConfirmButton from '@/components/admin/ConfirmButton';
import Notice from '@/components/admin/Notice';
import SelectAll from '@/components/admin/SelectAll';
import { adminCategories, adminProducts, adminSettings } from '@/lib/adminData';
import { filterProducts, LOW_STOCK, PRODUCT_SORTS, qp } from '@/lib/adminTools';
import { effectivePrice } from '@/lib/types';
import { money } from '@/lib/whatsapp';
import { bulkProductAction, duplicateProduct, quickUpdateProduct } from '../../actions';

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsAdmin({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const f = { q: qp(sp.q, 80), category: qp(sp.category, 80), status: qp(sp.status, 10), stock: qp(sp.stock, 10), sort: qp(sp.sort, 20) };
  const [all, categories, settings] = await Promise.all([adminProducts(), adminCategories(), adminSettings()]);
  const products = filterProducts(all, f);
  const sym = settings.currencySymbol;
  const filtersOn = Boolean(f.q || f.category || f.status || f.stock);

  const exportParams = new URLSearchParams({ type: 'products' });
  for (const [k, v] of Object.entries(f)) if (v) exportParams.set(k, v);
  const back = `/admin/products${(() => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(f)) if (v) p.set(k, v); const s = p.toString(); return s ? `?${s}` : ''; })()}`;
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-gold">Products <span className="text-lg text-mute">({products.length}{filtersOn ? ` of ${all.length}` : ''})</span></h1>
        <div className="flex gap-2">
          <a href={`/api/admin/export?${exportParams.toString()}`} className="btn-outline !py-2 text-xs">Download CSV</a>
          <Link href="/admin/products/new" className="btn-gold">+ Add product</Link>
        </div>
      </div>
      <Notice notice={qp(sp.notice, 200)} error={qp(sp.error, 200)} />

      <form method="get" role="search" className="grid gap-3 rounded-2xl border border-gold/25 bg-coal p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="pq" className="label-lux">Search</label>
          <input id="pq" name="q" defaultValue={f.q} placeholder="Name or SKU…" className="input-lux" />
        </div>
        <div>
          <label htmlFor="pc" className="label-lux">Category</label>
          <select id="pc" name="category" defaultValue={f.category} className="input-lux"><option value="">All</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        </div>
        <div>
          <label htmlFor="ps" className="label-lux">Status</label>
          <select id="ps" name="status" defaultValue={f.status} className="input-lux"><option value="">All</option><option value="active">Active</option><option value="draft">Draft</option></select>
        </div>
        <div>
          <label htmlFor="pk" className="label-lux">Stock</label>
          <select id="pk" name="stock" defaultValue={f.stock} className="input-lux"><option value="">All</option><option value="in">In stock</option><option value="low">Low (≤ {LOW_STOCK})</option><option value="out">Out of stock</option></select>
        </div>
        <div>
          <label htmlFor="po" className="label-lux">Sort</label>
          <select id="po" name="sort" defaultValue={f.sort || 'new'} className="input-lux">{PRODUCT_SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-gold !py-2.5">Apply</button>
          {filtersOn && <Link href="/admin/products" className="px-2 py-2.5 text-xs text-mute underline underline-offset-4">Reset</Link>}
        </div>
      </form>

      {all.length === 0 ? (
        <p className="text-mute">No products yet. Add one, or import the sample catalogue from the Dashboard.</p>
      ) : products.length === 0 ? (
        <p className="text-mute">No products match these filters.</p>
      ) : (
        <>
          <form id="bulk-products" action={bulkProductAction} className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/20 bg-coal px-4 py-3">
            <input type="hidden" name="back" value={back} />
            <SelectAll form="bulk-products" label="Select all shown" />
            <button name="action" value="publish" className="btn-outline !py-1.5 text-xs">Publish selected</button>
            <button name="action" value="draft" className="btn-outline !py-1.5 text-xs">Move to draft</button>
            <ConfirmButton name="action" value="delete" message="Delete the selected products permanently? This cannot be undone." className="ml-auto rounded-full border border-red-500/50 px-4 py-1.5 text-xs text-red-300 hover:bg-red-500/10">Delete selected</ConfirmButton>
          </form>

          <div className="overflow-x-auto rounded-2xl border border-gold/25 bg-coal">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mute">
                <tr><th className="w-10 p-3"><span className="sr-only">Select</span></th><th className="p-3">Product</th><th>Category</th><th>Price ({sym})</th><th>Stock</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const fid = `qe-${p.id}`;
                  const field = 'w-24 rounded-md border border-gold/30 bg-ink px-2 py-1.5 text-sm text-ivory focus:border-gold focus:outline-none';
                  return (
                    <tr key={p.id} className="border-t border-gold/10 align-middle">
                      <td className="p-3"><input type="checkbox" form="bulk-products" name="ids" value={p.id} aria-label={`Select ${p.name}`} className="h-4 w-4 accent-[rgb(var(--c-gold))]" /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.images[0] && <img src={p.images[0]} alt="" className="h-11 w-11 rounded-md object-cover" />}
                          <div>
                            <Link href={`/admin/products/${p.id}`} className="hover:text-gold">{p.name}</Link>
                            {p.sku && <p className="text-xs text-mute">SKU {p.sku}</p>}
                            {p.stock === 0 ? <p className="text-xs text-red-400">Out of stock</p> : p.stock <= LOW_STOCK ? <p className="text-xs text-gold">Low stock</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="text-mute">{catName(p.category)}</td>
                      <td>
                        <input form={fid} name="price" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={p.price} aria-label={`Regular price of ${p.name}`} className={field} />
                        {effectivePrice(p) < p.price && <p className="mt-1 text-xs text-mute">sale {money(effectivePrice(p), sym)}</p>}
                      </td>
                      <td><input form={fid} name="stock" type="number" inputMode="numeric" min="0" step="1" defaultValue={p.stock} aria-label={`Stock of ${p.name}`} className={`${field} !w-20`} /></td>
                      <td>
                        <select form={fid} name="status" defaultValue={p.status} aria-label={`Status of ${p.name}`} className={`${field} !w-24`}><option value="active">active</option><option value="draft">draft</option></select>
                      </td>
                      <td className="whitespace-nowrap pr-3 text-right">
                        <button form={fid} className="rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold/10">Save</button>
                        <button form={fid} formAction={duplicateProduct} className="ml-2 text-xs text-mute underline underline-offset-4 hover:text-gold">Duplicate</button>
                        <Link href={`/admin/products/${p.id}`} className="ml-3 text-xs text-gold underline underline-offset-4">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* one tiny form per row; the row's inputs/buttons attach to it with the HTML `form` attribute (forms cannot sit inside a table row) */}
          {products.map((p) => (
            <form key={p.id} id={`qe-${p.id}`} action={quickUpdateProduct}>
              <input type="hidden" name="id" value={p.id} />
            </form>
          ))}
          <p className="text-xs text-mute">Tip: change price, stock or status right in the table and press Save on that row. “Duplicate” creates a draft copy you can edit.</p>
        </>
      )}
    </div>
  );
}
