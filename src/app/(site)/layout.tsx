import StoreProvider from '@/components/StoreProvider';
import SerpentIntro from '@/components/SerpentIntro';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { getCategories, getSettings } from '@/lib/data';
import { siteUrl } from '@/lib/site';

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VENORA JEWELRY',
    url: siteUrl(),
    logo: `${siteUrl()}/images/emblem.png`,
    slogan: 'Elegance With An Edge.',
    sameAs: [settings.instagram, settings.tiktok, settings.youtube, settings.pinterest, settings.facebook].filter(Boolean),
  };

  return (
    <StoreProvider settings={settings}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <a href="#main" className="sr-only z-[300] rounded bg-gold px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <SerpentIntro />
      <AnnouncementBar />
      <Header categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      <main id="main">{children}</main>
      <Newsletter />
      <Footer settings={settings} />
      <FloatingWhatsApp />
    </StoreProvider>
  );
}
