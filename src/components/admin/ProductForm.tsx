'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { saveProduct, deleteProduct, type ProductInput } from '@/app/admin/actions';
import type { Category, Product } from '@/lib/types';

const blank: ProductInput = {
  name: '', slug: '', category: '', description: '', price: 0, salePrice: null, images: [], variants: [],
  stock: 10, status: 'active', badge: null, rating: null, reviewCount: 0, bestSeller: false, sku: '',
};

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const start = (fn: () => Promise<void>) => { setPending(true); fn().finally(() => setPending(false)); };
  const [f, setF] = useState<ProductInput>(
    product
      ? { id: product.id, name: product.name, slug: product.slug, category: product.category, description: product.description, price: product.price, salePrice: product.salePrice, images: product.images, variants: product.variants, stock: product.stock, status: product.status, badge: product.badge, rating: product.rating, reviewCount: product.reviewCount, bestSeller: product.bestSeller, sku: product.sku }
      : { ...blank, category: categories[0]?.slug ?? '' },
  );
  const [err, setErr] = useState('');
  const [upBusy, setUpBusy] = useState(false);
  const [pct, setPct] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [comboJson, setComboJson] = useState(JSON.stringify(product?.variantCombinations ?? [], null, 2));
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((p) => ({ ...p, [k]: v }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUpBusy(true);
    setErr('');
    const fd = new FormData();
    Array.from(files).forEach((x) => fd.append('files', x));
    try {
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      set('images', [...f.images, ...d.urls]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUpBusy(false);
    }
  }

  const move = (i: number, d: number) => {
    const a = [...f.images];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    set('images', a);
  };

  function applyPct(v: string) {
    setPct(v);
    const n = Number(v);
    if (n > 0 && n < 100 && f.price > 0) set('salePrice', Math.round(f.price * (1 - n / 100) * 100) / 100);
    if (!v) set('salePrice', null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    let variantCombinations;
    try { variantCombinations = JSON.parse(comboJson || '[]'); if (!Array.isArray(variantCombinations)) throw new Error('Expected a JSON array.'); }
    catch (e) { setErr(`Variant combinations: ${(e as Error).message}`); return; }
    start(async () => {
      const r = await saveProduct({ ...f, variantCombinations });
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
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {f.images.map((u, i) => (
              <li key={u + i} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="aspect-square w-full rounded-lg border border-gold/30 bg-black object-cover" />
                <div className="flex justify-between text-xs">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move earlier" className="px-2 text-gold">←</button>
                  <button type="button" onClick={() => set('images', f.images.filter((_, x) => x !== i))} className="text-red-400">Remove</button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move later" className="px-2 text-gold">→</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <label className="btn-outline cursor-pointer !py-2 text-[11px]">
              {upBusy ? 'Uploading…' : 'Upload images'}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
            </label>
            <input className="input-lux min-w-0 flex-1" placeholder="…or paste an https:// image URL" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} />
            <button type="button" className="btn-outline !py-2 text-[11px]" onClick={() => { if (/^https:\/\//i.test(imgUrl)) { set('images', [...f.images, imgUrl]); setImgUrl(''); } }}>Add URL</button>
          </div>
        </Card>

        <Card title="Variants (e.g. Length → 16&quot;, 18&quot;, 20&quot;)">
          {f.variants.map((v, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
              <input className="input-lux" placeholder="Name (Length)" value={v.name} onChange={(e) => set('variants', f.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="input-lux" placeholder="Options, comma separated" value={v.options.join(', ')} onChange={(e) => set('variants', f.variants.map((x, j) => (j === i ? { ...x, options: e.target.value.split(',').map((s) => s.trimStart()) } : x)))} />
              <button type="button" className="text-sm text-red-400" onClick={() => set('variants', f.variants.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn-outline !py-2 text-[11px]" onClick={() => set('variants', [...f.variants, { name: '', options: [] }])}>+ Add variant group</button>
          <div className="space-y-2 border-t border-gold/15 pt-4">
            <p className="text-sm font-medium text-gold">Combination pricing, images &amp; inventory</p>
            <p className="text-xs leading-relaxed text-mute">Add one entry for each sellable combination. The option names and values must match the groups above. Prices are regular prices; salePrice can be null. Example:</p>
            <pre className="overflow-x-auto rounded-lg bg-ink p-3 text-[11px] text-mute">{`[\n  {\n    "options": { "Set": "Set 1", "Color": "Gold" },\n    "price": 29.99, "salePrice": 24.99,\n    "sku": "VEN-SET1-GOLD", "stock": 12,\n    "images": ["https://example.com/gold.jpg"]\n  }\n]`}</pre>
            <textarea className="input-lux min-h-[220px] font-mono text-xs" value={comboJson} onChange={(e) => setComboJson(e.target.value)} spellCheck={false} aria-label="Variant combination JSON" />
          </div>
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
