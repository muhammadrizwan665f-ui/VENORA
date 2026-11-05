import Link from 'next/link';
import { logout } from '../actions';
import { requireAdmin } from '@/lib/auth';
import { adminSettings } from '@/lib/adminData';
import ThemeStyle from '@/components/ThemeStyle';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

const nav = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/orders', 'Orders'],
  ['/admin/settings', 'Settings'],
] as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const { theme } = await adminSettings();
  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[230px_1fr]">
      <ThemeStyle theme={theme} />
      <aside className="border-b border-gold/20 bg-coal lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <p className="gold-text font-display text-xl tracking-[0.3em]">VENORA</p>
          <p className="hidden text-xs text-mute lg:mt-1 lg:block">Admin</p>
          <form action={logout} className="lg:hidden"><button className="text-xs text-gold underline">Sign out</button></form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0" aria-label="Admin">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-ivory/90 hover:bg-gold/10 hover:text-gold">{label}</Link>
          ))}
          <Link href="/" target="_blank" className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-mute hover:text-gold">View store ↗</Link>
        </nav>
        <div className="hidden px-4 py-6 text-xs text-mute lg:block">
          <p className="truncate">{email}</p>
          <form action={logout}><button className="mt-2 text-gold underline underline-offset-4">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0 p-4 sm:p-8">{children}</div>
    </div>
  );
}
