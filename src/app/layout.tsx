import type { Metadata, Viewport } from 'next';
import { Cinzel, Cormorant_Garamond, Great_Vibes, Jost } from 'next/font/google';
import './globals.css';
import { siteUrl } from '@/lib/site';

const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-serif', display: 'swap' });
const display = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-display', display: 'swap' });
const script = Great_Vibes({ subsets: ['latin'], weight: '400', variable: '--font-script', display: 'swap' });
const sans = Jost({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-sans', display: 'swap' });

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
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${display.variable} ${script.variable} ${sans.variable}`}>
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
