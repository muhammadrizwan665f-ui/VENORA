'use client';

import { useState } from 'react';
import Gallery from './Gallery';
import WhatsAppButton from './WhatsAppButton';
import { Stars } from './ProductCard';
import { useStore } from './StoreProvider';
import { HeartIcon, MinusIcon, PlusIcon } from './Icons';
import { effectivePrice, toSummary, type Product } from '@/lib/types';
import { money } from '@/lib/whatsapp';

export default function ProductView({ product }: { product: Product }) {
  const { addToCart, toggleWish, isWished, settings } = useStore();
  const [qty, setQty] = useState(1);
  // Pre-select the first option of every variant group so the customer always sees exactly what will be ordered.
  const [chosen, setChosen] = useState<Record<string, string>>(() => Object.fromEntries(product.variants.map((v) => [v.name, v.options[0] ?? ''])));

  const summary = toSummary(product);
  const selectedCombination = product.variants.length
    ? product.variantCombinations?.find((combo) =>
        product.variants.every((group) => combo.options?.[group.name] === chosen[group.name]) &&
        Object.keys(combo.options ?? {}).length === product.variants.length,
      )
    : undefined;
  const price = selectedCombination ? (selectedCombination.salePrice !== null && selectedCombination.salePrice > 0 && selectedCombination.salePrice < selectedCombination.price ? selectedCombination.salePrice : selectedCombination.price) : effectivePrice(product);
  const variantText = product.variants.map((v) => `${v.name}: ${chosen[v.name]}`).join(', ') || undefined;
  const variantOptions = Object.keys(chosen).length ? chosen : undefined;
  const displayImages = selectedCombination?.images?.length ? selectedCombination.images : product.images;
  const stock = selectedCombination ? selectedCombination.stock : product.stock;
  const sku = selectedCombination?.sku || product.sku;
  const invalidCombination = Boolean(product.variantCombinations?.length && product.variants.length && !selectedCombination);
  const soldOut = stock <= 0 || invalidCombination;
  const maxQty = stock > 0 ? Math.min(stock, 99) : 99;
  const wished = isWished(product.id);
  const saving = (selectedCombination?.price ?? product.price) - price;

  const availability = soldOut
    ? { text: invalidCombination ? 'Combination unavailable' : 'Out of stock', cls: 'text-red-400' }
    : stock <= 5
      ? { text: `Only ${stock} left`, cls: 'text-amber-400' }
      : { text: 'In stock', cls: 'text-emerald-400' };

  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-2 lg:gap-14 lg:py-12">
      <Gallery images={displayImages} name={product.name} />

      <div className="lg:pt-2">
        {product.badge && (
          <span className={`mb-3 inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white ${product.badge === 'Hot' ? 'bg-[#c9343f]' : 'bg-[#2f9a78]'}`}>
            {product.badge}
          </span>
        )}
        <h1 className="font-serif text-4xl leading-tight text-ivory sm:text-5xl">{product.name}</h1>
        {product.rating !== null && (
          <div className="mt-2 flex justify-start">
            <Stars rating={product.rating} count={product.reviewCount} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <span className="gold-text font-serif text-4xl font-semibold">{money(price, settings.currencySymbol)}</span>
          {saving > 0 && (
            <>
              <span className="text-lg text-mute line-through">{money(selectedCombination?.price ?? product.price, settings.currencySymbol)}</span>
              <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs text-gold">Save {money(saving, settings.currencySymbol)}</span>
            </>
          )}
        </div>
        <p className={`mt-2 text-sm font-medium ${availability.cls}`} role="status">● {availability.text}</p>

        <p className="mt-5 text-[15px] leading-relaxed text-ivory/80">{product.description}</p>

        {product.variants.length > 0 && (
          <div className="mt-6 space-y-5">
            {product.variants.map((v) => (
              <fieldset key={v.name}>
                <legend className="label-lux">
                  {v.name}: <span className="normal-case tracking-normal text-gold">{chosen[v.name]}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {v.options.map((o) => {
                    const on = chosen[v.name] === o;
                    const comboColor = product.variantCombinations?.find((c) => c.options?.[v.name] === o)?.color;
                    const color = comboColor ?? (v.name.toLowerCase() === 'color' ? ({
                      gold: '#d4af37', silver: '#c0c0c0', 'rose gold': '#b76e79',
                      black: '#171717', white: '#f5f5f0', red: '#c62828',
                      blue: '#2563eb', green: '#27834a', pink: '#e58baa',
                      purple: '#8055a5', bronze: '#cd7f32',
                    } as Record<string, string>)[o.toLowerCase()] : undefined);
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setChosen((current) => ({ ...current, [v.name]: o }))}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm transition ${on ? 'border-gold bg-gold/15 text-gold' : 'border-gold/30 text-ivory hover:border-gold'}`}
                      >
                        {color && <span aria-hidden="true" className="h-4 w-4 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: color }} />}
                        {o}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="label-lux">Quantity</p>
          <div className="inline-flex items-center rounded-full border border-gold/40">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-gold hover:text-ivory">
              <MinusIcon />
            </button>
            <span className="w-10 text-center text-lg tabular-nums" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="grid h-11 w-11 place-items-center text-gold hover:text-ivory">
              <PlusIcon />
            </button>
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <WhatsAppButton
            name={product.name}
            slug={product.slug}
            price={price}
            quantity={qty}
            variant={variantText}
            outOfStock={soldOut}
            className="!min-h-[56px] !text-sm"
          />
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <button type="button" disabled={soldOut} onClick={() => addToCart({ product: summary, qty, variant: variantText, variantOptions, price, image: displayImages[0] || summary.image })} className="btn-outline">
              {soldOut ? 'Sold out' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={() => toggleWish(summary)}
              aria-pressed={wished}
              className={`btn-outline !px-5 ${wished ? '!bg-gold/15' : ''}`}
            >
              <HeartIcon filled={wished} width={18} height={18} />
              <span className="hidden sm:inline">{wished ? 'In wishlist' : 'Add to wishlist'}</span>
              <span className="sr-only sm:hidden">{wished ? 'Remove from wishlist' : 'Add to wishlist'}</span>
            </button>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gold/20 pt-6 text-sm">
          <dt className="text-mute">SKU</dt>
          <dd className="text-ivory/90">{sku || '—'}</dd>
          <dt className="text-mute">Shipping</dt>
          <dd className="text-ivory/90">Worldwide · luxury packaging included</dd>
          <dt className="text-mute">Ordering</dt>
          <dd className="text-ivory/90">We confirm availability, total and delivery with you on WhatsApp before anything ships.</dd>
        </dl>
      </div>
    </div>
  );
}
