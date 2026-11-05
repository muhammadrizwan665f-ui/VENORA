import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'VENORA JEWELRY is a luxury jewelry house inspired by the serpent: elegant, mysterious and bold. Discover our story and craft.',
  alternates: { canonical: '/about' },
};

const values = [
  ['Elegance', 'Refined silhouettes and a warm champagne-gold finish that moves from day to night.'],
  ['Edge', 'The serpent is our emblem: sinuous, fearless and unapologetically feminine.'],
  ['Craft', 'Every piece is inspected by hand before it is wrapped in our luxury packaging.'],
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Our story" title="Elegance With An Edge">
        Timeless designs. Inspired by the beauty of the serpent.
      </PageHero>

      <section className="container-x grid items-center gap-10 py-14 md:grid-cols-2 lg:gap-16">
        <Reveal className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/30">
          <Image src="/images/banner-snake.jpg" alt="A golden serpent with emerald eyes" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
        </Reveal>
        <Reveal delay={120}>
          <h2 className="font-serif text-3xl text-gold sm:text-4xl">Jewelry with a little mystery</h2>
          <p className="mt-4 leading-relaxed text-ivory/80">
            VENORA JEWELRY was created for women who want their jewelry to say something. The serpent has symbolised rebirth, allure and quiet power
            for thousands of years; we translate that spirit into necklaces, bracelets, rings, earrings, anklets and sets that feel luxurious and look bold.
          </p>
          <p className="mt-4 leading-relaxed text-ivory/80">
            We sell directly to our customers and keep ordering personal: choose your piece, message us on WhatsApp, and we confirm availability, delivery and
            payment with you one-to-one.
          </p>
          <Link href="/shop" className="btn-gold mt-7">Shop the collection</Link>
        </Reveal>
      </section>

      <section className="border-y border-gold/20 bg-coal">
        <div className="container-x grid gap-8 py-14 md:grid-cols-3">
          {values.map(([t, d], i) => (
            <Reveal key={t} delay={i * 100} className="text-center">
              <h3 className="font-display text-lg uppercase tracking-[0.25em] text-gold">{t}</h3>
              <div className="gold-rule mx-auto my-4 w-16" />
              <p className="text-sm leading-relaxed text-ivory/75">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
