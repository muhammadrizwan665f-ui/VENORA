import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import SmartImage from '@/components/SmartImage';
import { ArrowIcon, CrownIcon, DiamondIcon, GlobeIcon, HeadsetIcon, ShieldIcon } from '@/components/Icons';
import { getCategories, getProducts } from '@/lib/data';
import { toSummary } from '@/lib/types';

export const metadata: Metadata = {
  title: { absolute: 'VENORA JEWELRY — Elegance With An Edge. Luxury Serpent Jewelry' },
  description:
    'Timeless designs inspired by the beauty of the serpent. Shop snake necklaces, woven mesh chains, rings, bracelets, earrings and sets with free worldwide shipping. Order on WhatsApp.',
  alternates: { canonical: '/' },
};

const trust = [
  { Icon: DiamondIcon, a: 'Premium Quality', b: 'Guaranteed' },
  { Icon: GlobeIcon, a: 'Worldwide Shipping', b: 'Trusted Globally' },
  { Icon: ShieldIcon, a: 'Secure Shopping', b: 'Order Safely on WhatsApp' },
  { Icon: HeadsetIcon, a: 'Customer Support', b: "We're Here to Help" },
];

export default async function HomePage() {
  const [categories, best, all] = await Promise.all([getCategories(), getProducts({ bestSeller: true, limit: 5 }), getProducts({ sort: 'newest' })]);
  const bestSellers = [...best, ...all.filter((p) => !best.some((b) => b.id === p.id))].slice(0, 5);

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section
        aria-label="VENORA JEWELRY"
        className="relative isolate -mt-[var(--header-h)] flex min-h-[600px] items-end overflow-hidden bg-ink md:min-h-[660px] md:items-center lg:min-h-[720px]"
      >
        <div className="absolute inset-y-0 right-0 w-full md:w-[74%]">
          <Image
            src="/images/hero.jpg"
            alt="A model wearing VENORA serpent jewelry beside a golden serpent"
            fill
            priority
            sizes="(min-width:768px) 74vw, 100vw"
            className="animate-slowZoom object-cover object-[62%_center] md:object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-transparent md:from-ink md:via-ink/40 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />

        <div className="container-x relative z-10 pb-14 pt-[calc(var(--header-h)+40px)] md:pb-10">
          <div className="max-w-xl animate-fadeUp">
            <h1 className="leading-none">
              <span className="block bg-gradient-to-b from-white via-[#f3dfb6] to-gold bg-clip-text font-serif text-[64px] font-light tracking-[0.04em] text-transparent sm:text-[88px] lg:text-[112px]">
                VENORA
              </span>
              <span className="mt-1 block pl-1 font-display text-sm uppercase tracking-[0.7em] text-gold sm:text-xl">Jewelry</span>
            </h1>
            <p className="mt-5 font-script text-[44px] leading-tight text-gold sm:text-6xl">Elegance With An Edge.</p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ivory sm:text-lg">
              Timeless designs. Inspired by the beauty of the serpent.
            </p>
            <Link href="/shop" className="btn-outline mt-7 !border-gold/90 bg-black/30 !px-7 backdrop-blur-sm">
              Shop the Collection <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── TRUST BAR ───────── */}
      <section aria-label="Why Venora" className="border-y border-gold/30 bg-[linear-gradient(180deg,#0b0a08,#050505)]">
        <ul className="container-x grid grid-cols-2 gap-y-6 py-6 lg:grid-cols-4 lg:py-7">
          {trust.map(({ Icon, a, b }, i) => (
            <li key={a} className={`flex items-center justify-center gap-3 px-2 sm:gap-4 ${i > 0 ? 'lg:border-l lg:border-gold/30' : ''} ${i % 2 === 1 ? 'border-l border-gold/30 lg:border-l' : ''}`}>
              <Icon className="h-9 w-9 shrink-0 text-gold sm:h-10 sm:w-10" />
              <span className="text-[13px] leading-snug sm:text-sm">
                <span className="block text-ivory">{a}</span>
                <span className="block text-ivory/70">{b}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── EXPLORE COLLECTIONS ───────── */}
      <section aria-labelledby="collections-title" className="container-x pb-6 pt-14 sm:pt-16">
        <Reveal className="mb-9 flex items-center justify-center gap-4">
          <span className="gold-rule hidden w-24 sm:block lg:w-40" />
          <h2 id="collections-title" className="section-title text-center">Explore Our Collections</h2>
          <span className="gold-rule hidden w-24 sm:block lg:w-40" />
        </Reveal>
        <ul className="grid grid-cols-3 gap-x-3 gap-y-9 sm:grid-cols-6">
          {categories.map((c, i) => (
            <Reveal as="li" key={c.slug} delay={i * 70}>
              <Link href={`/collections/${c.slug}`} className="group flex flex-col items-center text-center">
                <span className="relative block h-[92px] w-[92px] rounded-full bg-gradient-to-br from-[#f1d9a2] via-gold to-gold-deep p-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.6)] transition duration-500 group-hover:scale-105 group-hover:shadow-[0_0_34px_-4px_rgba(214,173,104,0.8)] sm:h-[100px] sm:w-[100px] md:h-[120px] md:w-[120px] lg:h-[140px] lg:w-[140px]">
                  <span className="relative block h-full w-full overflow-hidden rounded-full bg-black">
                    <SmartImage src={c.image} alt={c.name} sizes="140px" className="object-cover transition duration-700 group-hover:scale-110" />
                  </span>
                </span>
                <span className="mt-3 font-serif text-lg text-ivory transition group-hover:text-gold">{c.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-mute transition group-hover:text-gold">
                  Shop Now <ArrowIcon width={11} height={11} />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ───────── BEST SELLERS ───────── */}
      <section aria-labelledby="best-title" className="container-x py-12 sm:py-14">
        <Reveal className="mb-8 flex items-center gap-3">
          <CrownIcon className="text-gold" />
          <h2 id="best-title" className="section-title">Best Sellers</h2>
          <span className="gold-rule hidden flex-1 sm:block" />
          <Link href="/shop" className="ml-auto flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-gold hover:text-ivory sm:ml-0">
            View all <ArrowIcon width={13} height={13} />
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {bestSellers.map((p, i) => (
            <Reveal key={p.id} delay={i * 80} className="h-full">
              <ProductCard product={toSummary(p)} priority={i < 2} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── PROMO BANNERS ───────── */}
      <section aria-label="Featured" className="container-x pb-14">
        <div className="grid gap-3 md:grid-cols-3">
          <Banner img="/images/banner-box.jpg" alt="Black gift box with a gold ribbon" href="/shop" cta="Shop Now">
            <p className="font-serif text-2xl leading-tight text-gold sm:text-[28px]">Luxury Packaging</p>
            <p className="mt-1 font-serif text-lg leading-snug text-ivory/90">Free with Every Order</p>
          </Banner>
          <Banner img="/images/banner-snake.jpg" alt="A golden serpent with emerald eyes" href="/collections/necklaces" cta="Shop the Trend">
            <p className="font-serif text-2xl leading-tight text-ivory sm:text-[28px]">Be Bold. Be Venora.</p>
          </Banner>
          <Banner img="/images/banner-model.jpg" alt="Model wearing a serpent necklace and earrings" href="/collections/jewelry-sets" cta="Shop Now">
            <p className="font-serif text-2xl leading-tight text-ivory sm:text-[28px]">A Timeless Statement</p>
          </Banner>
        </div>
      </section>
    </>
  );
}

function Banner({ img, alt, href, cta, children }: { img: string; alt: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <Link href={href} className="group relative flex h-44 overflow-hidden rounded-xl border border-gold/30 bg-coal transition duration-500 hover:border-gold/80 hover:shadow-[0_18px_40px_-18px_rgba(214,173,104,0.5)] sm:h-48">
        <span className="relative block w-1/2 shrink-0">
          <SmartImage src={img} alt={alt} sizes="(min-width:768px) 17vw, 45vw" className="object-cover transition duration-700 group-hover:scale-110" />
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-coal" />
        </span>
        <span className="relative flex flex-1 flex-col justify-center pr-4 text-left">
          {children}
          <span className="mt-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-gold transition group-hover:gap-2.5">
            {cta} <ArrowIcon width={13} height={13} />
          </span>
        </span>
      </Link>
    </Reveal>
  );
}
