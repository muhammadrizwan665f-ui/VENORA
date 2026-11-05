import Link from 'next/link';
import Logo from './Logo';
import { FacebookIcon, InstagramIcon, PinterestIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from './Icons';
import { waLink } from '@/lib/whatsapp';
import type { StoreSettings } from '@/lib/types';

const links = [
  ['Shop', '/shop'],
  ['About Us', '/about'],
  ['FAQ', '/faq'],
  ['Shipping', '/shipping-policy'],
  ['Returns', '/return-policy'],
  ['Track Order', '/track-order'],
  ['Contact', '/contact'],
] as const;

export default function Footer({ settings }: { settings: StoreSettings }) {
  const socials = [
    { href: settings.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: settings.tiktok, label: 'TikTok', Icon: TikTokIcon },
    { href: settings.youtube, label: 'YouTube', Icon: YouTubeIcon },
    { href: settings.pinterest, label: 'Pinterest', Icon: PinterestIcon },
    { href: settings.facebook, label: 'Facebook', Icon: FacebookIcon },
  ].filter((s) => s.href);

  return (
    <footer className="relative border-t border-gold/30 bg-ink">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[auto_1fr_auto] md:items-center lg:gap-16">
        <div className="flex justify-center md:justify-start">
          <Logo stacked logoUrl={settings.logoUrl} />
        </div>

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-0 gap-y-3 text-[13px] text-ivory/90">
          {links.map(([label, href], i) => (
            <span key={href} className="flex items-center">
              {i > 0 && <span className="mx-3 h-3 w-px bg-gold/40" aria-hidden="true" />}
              <Link href={href} className="transition hover:text-gold">{label}</Link>
            </span>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex items-center gap-2 text-[13px] text-ivory/90">
            <span>Follow Us:</span>
            <a
              href={waLink(settings.whatsappNumber, 'Hello VENORA JEWELRY!')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-md bg-white/5 text-gold transition hover:bg-gold hover:text-ink"
            >
              <WhatsAppIcon width={18} height={18} />
            </a>
            {socials.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-md bg-white/5 text-gold transition hover:bg-gold hover:text-ink">
                <Icon />
              </a>
            ))}
          </div>
          {settings.phone && <p className="text-xs text-mute">WhatsApp: {settings.phone}</p>}
        </div>
      </div>

      <div className="border-t border-gold/15">
        <div className="container-x flex flex-col items-center gap-3 py-5 text-[11px] text-mute sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Venora Jewelry. All rights reserved.</p>
          <p className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-gold">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-gold">Terms &amp; Conditions</Link>
          </p>
          <p className="flex items-center gap-3 text-gold/90">
            <span className="h-px w-10 bg-gold/50" /> Jewelry Beyond Ordinary. <span className="h-px w-6 bg-gold/50" />
          </p>
        </div>
      </div>
    </footer>
  );
}
