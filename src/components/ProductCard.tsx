'use client';

import Link from 'next/link';
import SmartImage from './SmartImage';
import WhatsAppButton from './WhatsAppButton';
import { useStore } from './StoreProvider';
import { HeartIcon, StarIcon } from './Icons';
import { effectivePrice, type ProductSummary } from '@/lib/types';
import { money } from '@/lib/whatsapp';

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center justify-center gap-0.5 text-gold" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={rating >= n - 0.25} />
      ))}
      {count ? <span className="ml-1 text-[11px] text-mute">({count})</span> : null}
    </div>
  );
}

export function PriceTag({ product, size = 'md' }: { product: Pick<ProductSummary, 'price' | 'salePrice'>; size?: 'md' | 'lg' }) {
  const { settings } = useStore();
  const now = effectivePrice(product);
  const onSale = now < product.price;
  return (
    <p className="flex items-baseline justify-center gap-2">
      <span className={`font-semibold text-ivory ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>{money(now, settings.currencySymbol)}</span>
      {onSale && <span className={`text-mute line-through decoration-mute/60 ${size === 'lg' ? 'text-lg' : 'text-xs'}`}>{money(product.price, settings.currencySymbol)}</span>}
    </p>
  );
}

export default function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const { addToCart, toggleWish, isWished } = useStore();
  const wished = isWished(product.id);
  const soldOut = product.stock <= 0;
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-coal to-ink transition duration-500 hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(214,173,104,0.45)]">
      <div className="relative">
        <Link href={href} className="relative block aspect-[4/3.6] overflow-hidden bg-black" aria-label={product.name}>
          <SmartImage
            src={product.image}
            alt={product.name}
            priority={priority}
            sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw"
            className="object-cover transition duration-700 group-hover:scale-110"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </Link>
        {product.badge && (
          <span
            className={`absolute left-0 top-2 rounded-r-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white ${
              product.badge === 'Hot' ? 'bg-[#c9343f]' : 'bg-[#2f9a78]'
            }`}
          >
            {product.badge}
          </span>
        )}
        {soldOut && <span className="absolute bottom-2 left-2 rounded-full bg-black/80 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-mute">Sold out</span>}
        <button
          type="button"
          onClick={() => {
            toggleWish(product);
          }}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={`absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/50 backdrop-blur transition hover:scale-110 ${wished ? 'text-gold' : 'text-ivory/90 hover:text-gold'}`}
        >
          <HeartIcon filled={wished} width={18} height={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center px-2.5 pb-4 pt-3 text-center sm:px-4">
        <h3 className="font-serif text-[17px] leading-snug text-ivory sm:text-lg">
          <Link href={href} className="hover:text-gold">
            {product.name}
          </Link>
        </h3>
        {product.rating !== null && (
          <div className="mt-1">
            <Stars rating={product.rating} count={product.reviewCount} />
          </div>
        )}
        <div className="mt-1.5">
          <PriceTag product={product} />
        </div>

        {/* Order button sits directly under the product info + price */}
        <div className="mt-auto w-full space-y-2 pt-3">
          <WhatsAppButton name={product.name} slug={product.slug} price={effectivePrice(product)} quantity={1} outOfStock={soldOut} />
          {product.hasVariants ? (
            <Link href={href} className="btn-outline w-full !px-3 text-[11px] sm:text-xs">
              Select options
            </Link>
          ) : (
            <button
              type="button"
              disabled={soldOut}
              onClick={() => addToCart({ product })}
              className="btn-outline w-full !px-3 text-[11px] sm:text-xs"
            >
              {soldOut ? 'Sold out' : 'Add to cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
