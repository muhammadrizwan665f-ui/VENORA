import Link from 'next/link';

/** Gold serpent emblem + VENORA / JEWELRY wordmark. `stacked` mirrors the reference header on desktop. */
export default function Logo({ stacked = false, logoUrl = '/images/emblem.png', small = false }: { stacked?: boolean; logoUrl?: string; small?: boolean }) {
  return (
    <Link href="/" aria-label="VENORA JEWELRY — home" className={`group flex items-center ${stacked ? 'flex-col gap-0.5' : 'gap-2.5'}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        width={72}
        height={50}
        className={`w-auto object-contain transition duration-500 group-hover:drop-shadow-[0_0_12px_rgba(214,173,104,0.8)] ${small ? 'h-7' : stacked ? 'h-10 md:h-11' : 'h-9'}`}
      />
      <span className={`flex ${stacked ? 'flex-col items-center' : 'flex-col items-start'} leading-none`}>
        <span className={`gold-text font-display font-medium ${small ? 'text-lg tracking-[0.2em]' : stacked ? 'text-[26px] tracking-[0.24em]' : 'text-[22px] tracking-[0.22em]'}`}>VENORA</span>
        <span className={`mt-1 font-display uppercase text-gold/90 ${small ? 'text-[7px] tracking-[0.55em]' : 'text-[8px] tracking-[0.65em]'}`}>Jewelry</span>
      </span>
    </Link>
  );
}
