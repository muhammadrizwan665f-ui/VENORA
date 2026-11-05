import type { ReactNode } from 'react';
import PageHero from './PageHero';

export default function LegalPage({ title, eyebrow, updated, children }: { title: string; eyebrow?: string; updated?: string; children: ReactNode }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title}>
        {updated && <>Last updated {updated}</>}
      </PageHero>
      <article className="container-x prose-lux max-w-3xl py-12">{children}</article>
    </>
  );
}
