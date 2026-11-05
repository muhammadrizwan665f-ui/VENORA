import type { ReactNode } from 'react';

/** Simple luxury page heading for inner pages. */
export default function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-gold/20 bg-[radial-gradient(ellipse_at_top,rgb(var(--c-gold)/0.12),transparent_60%)]">
      <div className="container-x py-12 text-center sm:py-16">
        {eyebrow && <p className="font-script text-3xl text-gold sm:text-4xl">{eyebrow}</p>}
        <h1 className="gold-text font-serif text-4xl font-medium sm:text-5xl">{title}</h1>
        <div className="gold-rule mx-auto mt-5 w-40" />
        {children && <div className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-mute">{children}</div>}
      </div>
    </section>
  );
}
