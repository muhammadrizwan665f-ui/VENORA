'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import SearchOverlay from './SearchOverlay';
import { useStore } from './StoreProvider';
import { BagIcon, ChevronDown, CloseIcon, HeartIcon, MenuIcon, SearchIcon, WhatsAppIcon } from './Icons';
import { waLink } from '@/lib/whatsapp';

type Cat = { slug: string; name: string };

export default function Header({ categories }: { categories: Cat[] }) {
  const pathname = usePathname();
  const { count, wishlist, settings, hydrated } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [open, setOpen] = useState<string | null>(null); // mobile accordion
  const isHome = pathname === '/';
  const solid = scrolled || !isHome;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu || search ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menu, search]);

  const link = (href: string) =>
    `relative py-2 text-[13px] tracking-wide transition hover:text-gold after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100 ${
      pathname === href ? 'text-gold after:scale-x-100' : 'text-ivory'
    }`;

  const dropdown = (label: string, href: string, items: { href: string; label: string }[]) => (
    <div className="group relative">
      <Link href={href} className={`${link(href)} inline-flex items-center gap-1`}>
        {label}
        <ChevronDown />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 translate-y-2 rounded-xl border border-gold/30 bg-coal/98 p-2 opacity-0 shadow-2xl backdrop-blur transition duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2 text-sm text-ivory/90 transition hover:bg-gold/10 hover:text-gold">
            {i.label}
          </Link>
        ))}
      </div>
    </div>
  );

  const catItems = categories.map((c) => ({ href: `/collections/${c.slug}`, label: c.name }));

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          solid ? 'border-b border-gold/20 bg-ink/90 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md' : 'border-b border-transparent bg-gradient-to-b from-black/80 to-transparent'
        }`}
        style={{ height: 'var(--header-h)' }}
      >
        <div className="container-x flex h-full items-center justify-between gap-4">
          <button type="button" className="-ml-2 grid h-11 w-11 place-items-center text-gold lg:hidden" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <MenuIcon width={26} height={26} />
          </button>

          {/* logo: horizontal on mobile, stacked on desktop */}
          <div className={`absolute left-1/2 -translate-x-1/2 transition-transform duration-500 lg:static lg:translate-x-0 ${scrolled ? 'lg:scale-[0.82]' : ''} origin-left`}>
            <div className="lg:hidden"><Logo small /></div>
            <div className="hidden lg:block"><Logo stacked logoUrl={settings.logoUrl} /></div>
          </div>

          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            <Link href="/" className={link('/')}>Home</Link>
            {dropdown('Shop', '/shop', [{ href: '/shop', label: 'Shop All' }, ...catItems])}
            {dropdown('Collections', '/shop', catItems)}
            <Link href="/about" className={link('/about')}>About Us</Link>
            <Link href="/track-order" className={link('/track-order')}>Track Order</Link>
            <Link href="/contact" className={link('/contact')}>Contact</Link>
          </nav>

          <div className="flex items-center gap-0.5 text-gold sm:gap-1.5">
            <button type="button" aria-label="Search" onClick={() => setSearch(true)} className="grid h-11 w-11 place-items-center transition hover:scale-110 hover:text-ivory">
              <SearchIcon width={22} height={22} />
            </button>
            <Link href="/wishlist" aria-label={`Wishlist${hydrated ? `, ${wishlist.length} items` : ''}`} className="relative hidden h-11 w-11 place-items-center transition hover:scale-110 hover:text-ivory sm:grid">
              <HeartIcon width={22} height={22} />
              {hydrated && wishlist.length > 0 && <Badge n={wishlist.length} />}
            </Link>
            <Link href="/cart" aria-label={`Shopping cart${hydrated ? `, ${count} items` : ''}`} className="relative grid h-11 w-11 place-items-center transition hover:scale-110 hover:text-ivory">
              <BagIcon width={22} height={22} />
              <Badge n={hydrated ? count : 0} always />
            </Link>
          </div>
        </div>
      </header>

      {search && <SearchOverlay onClose={() => setSearch(false)} />}

      {/* mobile menu */}
      <div className={`fixed inset-0 z-[100] lg:hidden ${menu ? '' : 'pointer-events-none'}`} aria-hidden={!menu}>
        <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${menu ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenu(false)} />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto border-r border-gold/30 bg-gradient-to-b from-coal to-ink p-6 transition-transform duration-500 ${menu ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-label="Menu"
        >
          <div className="mb-6 flex items-center justify-between">
            <Logo small />
            <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid h-11 w-11 place-items-center text-gold">
              <CloseIcon width={26} height={26} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col font-serif text-2xl" aria-label="Mobile">
            <MLink href="/">Home</MLink>
            <button type="button" onClick={() => setOpen(open === 'shop' ? null : 'shop')} className="flex items-center justify-between border-b border-gold/15 py-3.5 text-left text-ivory" aria-expanded={open === 'shop'}>
              Shop <ChevronDown className={`transition ${open === 'shop' ? 'rotate-180' : ''}`} />
            </button>
            {open === 'shop' && (
              <div className="flex flex-col gap-1 border-b border-gold/15 pb-3 pl-3 font-sans text-base">
                <Link href="/shop" className="py-2 text-gold">Shop All</Link>
                {categories.map((c) => (
                  <Link key={c.slug} href={`/collections/${c.slug}`} className="py-2 text-ivory/85">{c.name}</Link>
                ))}
              </div>
            )}
            <MLink href="/wishlist">Wishlist</MLink>
            <MLink href="/about">About Us</MLink>
            <MLink href="/track-order">Track Order</MLink>
            <MLink href="/contact">Contact</MLink>
          </nav>
          <a
            href={waLink(settings.whatsappNumber, 'Hello VENORA JEWELRY! I have a question about your jewelry.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold mt-6 w-full"
          >
            <WhatsAppIcon width={18} height={18} /> Chat on WhatsApp
          </a>
        </aside>
      </div>
    </>
  );
}

function MLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="border-b border-gold/15 py-3.5 text-ivory transition hover:text-gold">
      {children}
    </Link>
  );
}

function Badge({ n, always }: { n: number; always?: boolean }) {
  if (!always && n <= 0) return null;
  return (
    <span className="absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-ink" aria-hidden="true">
      {n > 99 ? '99+' : n}
    </span>
  );
}
