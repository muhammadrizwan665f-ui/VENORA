'use client';

import type { MouseEvent } from 'react';
import { useStore } from './StoreProvider';
import { WhatsAppIcon } from './Icons';
import { buildProductMessage, waLink } from '@/lib/whatsapp';
import { productUrl, siteUrl } from '@/lib/site';

type Props = {
  name: string;
  slug: string;
  price: number; // the price the customer will actually pay (sale price when discounted)
  quantity?: number;
  variant?: string;
  outOfStock?: boolean;
  label?: string;
  className?: string;
};

/**
 * "ORDER ON WHATSAPP". Each instance builds its own wa.me link from the configured store number and the
 * exact product / quantity / variant it was rendered with. The href is real (works without JS); on click we
 * rebuild it with the live origin so the product link in the message is always the page the customer is on.
 */
export default function WhatsAppButton({ name, slug, price, quantity = 1, variant, outOfStock, label = 'ORDER ON WHATSAPP', className = '' }: Props) {
  const { settings } = useStore();
  const build = (base: string) =>
    waLink(
      settings.whatsappNumber,
      buildProductMessage({ name, price, quantity, url: productUrl(slug, base), variant, symbol: settings.currencySymbol, outOfStock }),
    );

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const w = window.open(build(window.location.origin), '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = build(window.location.origin); // popup blocked: navigate instead
  };

  return (
    <a
      href={build(siteUrl())}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${name}`}
      data-whatsapp-order
      className={`btn-gold w-full !px-3 text-[11px] leading-tight sm:text-xs ${className}`}
    >
      <WhatsAppIcon width={18} height={18} className="shrink-0" />
      <span>{label}</span>
    </a>
  );
}
