'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { saveProduct, deleteProduct, type ProductInput } from '@/app/admin/actions';
import ImageUploader from './ImageUploader';
import type { Category, Product, VariantCombination } from '@/lib/types';

const blank: ProductInput = {
  name: '', slug: '', category: '', description: '', price: 0, salePrice: null, images: [], variants: [], variantCombinations: [],
  stock: 10, status: 'active', badge: null, rating: null, reviewCount: 0, bestSeller: false, sku: '',
};

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const start = (fn: () => Promise<void>) => { setPending(true); fn().finally(() => setPending(false)); };
  const [f, setF] = useState<ProductInput>(
    product
      ? { id: product.id, name: product.name, slug: product.slug, category: product.category, description: product.description, price: product.price, salePrice: product.salePrice, images: product.images, variants: product.variants, variantCombinations: product.variantCombinations ?? [], stock: product.stock, status: product.status, badge: product.badge, rating: product.rating, reviewCount: product.reviewCount, bestSeller: product.bestSeller, sku: product.sku }
      : { ...blank, category: categories[0]?.slug ?? '' },
  );
  const [err, setErr] = useState('');
  const [pct, setPct] = useState('');
  type Row = { name: string; color: string; price: number; salePrice: number | null; sku: string; stock: number; images: string[] };
  const [label, setLabel] = useState(product?.variants?.[0]?.name && product.variants.length === 1 ? product.variants[0].name : 'Option');
  const [rows, setRows] = useState<Row[]>(() => (product?.variantCombinations ?? []).map((c) => ({
    name: Object.values(c.options).join(' · '), color: c.color ?? '', price: c.price, salePrice: c.salePrice, sku: c.sku, stock: c.stock, images: c.images ?? [],
  })));
  const patchRow = (i: number, patch: Partial<Row>) => setRows((all) => all.map((r, x) => (x === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((all) => [...all, { name: '', color: '', price: f.price, salePrice: null, sku: '', stock: f.stock, images: [] }].slice(0, 100));
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((p) => ({ ...p, [k]: v }));

  function applyPct(v: string) {
    setPct(v);
    const n = Number(v);
    if (n > 0 && n < 100 && f.price > 0) set('salePrice', Math.round(f.price * (1 - n / 100) * 100) / 100);
    if (!v) set('salePrice', null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const names = rows.map((r) => r.name.trim());
    if (names.some((n) => !n)) return setErr('Every variant needs a name (for example Purple, Full Set or Set of 3).');
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return setErr('Variant names must be different from each other.');
    const group = label.trim() || 'Option';
    const variants = rows.length ? [{ name: group, options: names }] : [];
    const variantCombinations: VariantCombination[] = rows.map((r, i) => ({
      options: { [group]: names[i] }, price: r.price, salePrice: r.salePrice, sku: r.sku, stock: r.stock, images: r.images, ...(r.color ? { color: r.color } : {}),
    }));
    start(async () => {
      const r = await saveProduct({ ...f, variants, variantCombinations });
      if (!r.ok) return setErr(r.error || 'Could not save.');
      router.push('/admin/products');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card title="Details">
          <L label="Name *"><input className="input-lux" value={f.name} onChange={(e) => set('name', e.target.value)} required maxLength={140} /></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="URL slug (auto if empty)"><input className="input-lux" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="snake-ring" /></L>
            <L label="SKU"><input className="input-lux" value={f.sku} onChange={(e) => set('sku', e.target.value)} /></L>
          </div>
          <L label="Description"><textarea className="input-lux min-h-[120px]" value={f.description} onChange={(e) => set('description', e.target.value)} /></L>
        </Card>

        <Card title="Images (first image is the main one)">
          <ImageUploader value={f.images} onChange={(u) => setF((p) => ({ ...p, images: u(p.images) }))} max={12} label="Upload Images" />
        </Card>

        <p className="text-[10px] uppercase tracking-widest text-mute">Product form v2 · build {process.env.NEXT_PUBLIC_BUILD_SHA}</p>
        <Card title="Variants (optional)">
          <p className="text-sm leading-relaxed text-mute">Add a variant for every colour, style or full set you sell. Each variant has its own name, colour, price, stock and photos. Leave empty if the product has no variants.</p>
          {rows.length > 0 && (
            <L label="What do customers choose? (e.g. Color, Set, Style)"><input className="input-lux max-w-xs" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} /></L>
          )}
          {rows.map((r, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-gold/20 bg-ink/50 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[10rem] flex-1"><span className="label-lux">Name</span><input className="input-lux" placeholder="Purple, Full Set, Set of 3…" maxLength={40} value={r.name} onChange={(e) => patchRow(i, { name: e.target.value })} /></label>
                <label><span className="label-lux">Colour</span>
                  <span className="flex items-center gap-2">
                    <input type="color" aria-label="Variant colour" className="h-10 w-12 cursor-pointer rounded border border-gold/30 bg-transparent" value={r.color || '#d4af37'} onChange={(e) => patchRow(i, { color: e.target.value })} />
                    {r.color && <button type="button" className="text-xs text-mute underline" onClick={() => patchRow(i, { color: '' })}>None</button>}
                  </span>
                </label>
                <button type="button" className="pb-2 text-xs text-red-400" onClick={() => setRows((all) => all.filter((_, x) => x !== i))}>Remove variant</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <L label="Regular price"><input className="input-lux" type="number" min="0" step="0.01" value={r.price} onChange={(e) => patchRow(i, { price: Number(e.target.value) })} /></L>
                <L label="Sale price (optional)"><input className="input-lux" type="number" min="0" step="0.01" value={r.salePrice ?? ''} onChange={(e) => patchRow(i, { salePrice: e.target.value === '' ? null : Number(e.target.value) })} /></L>
                <L label="Stock"><input className="input-lux" type="number" min="0" step="1" value={r.stock} onChange={(e) => patchRow(i, { stock: Number(e.target.value) })} /></L>
                <L label="SKU"><input className="input-lux" value={r.sku} onChange={(e) => patchRow(i, { sku: e.target.value })} /></L>
              </div>
              <div className="space-y-2">
                <p className="label-lux">Variant images</p>
                <ImageUploader value={r.images} onChange={(u) => setRows((all) => all.map((x, j) => (j === i ? { ...x, images: u(x.images) } : x)))} max={12} label="Upload Images" />
              </div>
            </div>
          ))}
          <button type="button" className="btn-outline !py-2 text-[11px]" onClick={addRow}>+ Add variant</button>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Pricing &amp; stock">
          <L label="Regular price *"><input className="input-lux" type="number" min="0" step="0.01" value={f.price} onChange={(e) => set('price', Number(e.target.value))} required /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Discount %"><input className="input-lux" type="number" min="0" max="99" value={pct} onChange={(e) => applyPct(e.target.value)} placeholder="35" /></L>
            <L label="Sale price"><input className="input-lux" type="number" min="0" step="0.01" value={f.salePrice ?? ''} onChange={(e) => { setPct(''); set('salePrice', e.target.value === '' ? null : Number(e.target.value)); }} /></L>
          </div>
          <L label="Inventory (units)"><input className="input-lux" type="number" min="0" value={f.stock} onChange={(e) => set('stock', Number(e.target.value))} /></L>
        </Card>
        <Card title="Organisation">
          <L label="Category *">
            <select className="input-lux" value={f.category} onChange={(e) => set('category', e.target.value)} required>
              {categories.length === 0 && <option value="">Create a category first</option>}
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </L>
          <L label="Status"><select className="input-lux" value={f.status} onChange={(e) => set('status', e.target.value as 'active' | 'draft')}><option value="active">Active (visible)</option><option value="draft">Draft (hidden)</option></select></L>
          <L label="Badge"><select className="input-lux" value={f.badge ?? ''} onChange={(e) => set('badge', (e.target.value || null) as 'Hot' | 'New' | null)}><option value="">None</option><option>Hot</option><option>New</option></select></L>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.bestSeller} onChange={(e) => set('bestSeller', e.target.checked)} /> Show in Best Sellers</label>
        </Card>
        <Card title="Reviews (real data only)">
          <p className="text-xs text-mute">Stars are shown on the site only when you enter a rating. Leave empty if you have no genuine reviews.</p>
          <div className="grid grid-cols-2 gap-3">
            <L label="Rating 0–5"><input className="input-lux" type="number" min="0" max="5" step="0.1" value={f.rating ?? ''} onChange={(e) => set('rating', e.target.value === '' ? null : Number(e.target.value))} /></L>
            <L label="Review count"><input className="input-lux" type="number" min="0" value={f.reviewCount} onChange={(e) => set('reviewCount', Number(e.target.value))} /></L>
          </div>
        </Card>

        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button type="submit" disabled={pending} className="btn-gold w-full">{pending ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button>
        {product && (
          <button type="button" className="w-full text-sm text-red-400 underline underline-offset-4" onClick={() => confirm('Delete this product permanently?') && start(async () => { const r = await deleteProduct(product.id); if (r.ok) { router.push('/admin/products'); router.refresh(); } else setErr(r.error || 'Delete failed'); })}>Delete product</button>
        )}
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-gold/25 bg-coal p-5">
      <h2 className="font-serif text-xl text-gold" dangerouslySetInnerHTML={{ __html: title }} />
      {children}
    </section>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label-lux">{label}</span>{children}</label>;
}
