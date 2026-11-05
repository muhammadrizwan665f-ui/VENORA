import type { Metadata, Viewport } from 'next';
// Fonts are bundled from npm (@fontsource) so the build never depends on fetching Google Fonts.
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/500.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import './globals.css';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'VENORA JEWELRY — Elegance With An Edge.', template: '%s | VENORA JEWELRY' },
  description:
    'Luxury serpent-inspired jewelry: snake necklaces, woven mesh chains, rings, bracelets, earrings, anklets and sets. Free worldwide shipping. Order easily on WhatsApp.',
  applicationName: 'VENORA JEWELRY',
  icons: { icon: '/images/emblem.png', apple: '/images/emblem.png' },
  openGraph: {
    type: 'website',
    siteName: 'VENORA JEWELRY',
    title: 'VENORA JEWELRY — Elegance With An Edge.',
    description: 'Timeless designs. Inspired by the beauty of the serpent.',
    images: [{ url: '/images/hero.jpg', width: 1626, height: 904, alt: 'VENORA JEWELRY serpent jewelry' }],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#050505', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('venora.veil'))document.documentElement.classList.add('veil-skip')}catch(e){}" }} />
      </head>
      <body className="min-h-screen font-sans">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}.intro-veil{display:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
