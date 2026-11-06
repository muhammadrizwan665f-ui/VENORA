import Link from 'next/link';
import { logout } from '../actions';
import { requireAdmin } from '@/lib/auth';
import { adminSettings, pendingOrderCount } from '@/lib/adminData';
import ThemeStyle from '@/components/ThemeStyle';
import AdminPalette from '@/components/admin/AdminPalette';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

const nav = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/orders', 'Orders'],
  ['/admin/customers', 'Customers'],
  ['/admin/subscribers', 'Subscribers'],
  ['/admin/tools', 'Tools & backup'],
  ['/admin/settings', 'Settings & themes'],
] as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const [{ theme }, pending] = await Promise.all([adminSettings(), pendingOrderCount()]);
  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[230px_1fr] print:block print:bg-white">
      <ThemeStyle theme={theme} />
      <aside className="border-b border-gold/20 bg-coal lg:border-b-0 lg:border-r print:hidden">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <p className="gold-text font-display text-xl tracking-[0.3em]">VENORA</p>
          <p className="hidden text-xs text-mute lg:mt-1 lg:block">Admin</p>
          <form action={logout} className="lg:hidden"><button className="text-xs text-gold underline">Sign out</button></form>
        </div>
        <div className="px-3 pb-3"><AdminPalette /></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0" aria-label="Admin">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-ivory/90 hover:bg-gold/10 hover:text-gold">
              {label}
              {href === '/admin/orders' && pending > 0 && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-ink" aria-label={`${pending} pending orders`}>{pending > 99 ? '99+' : pending}</span>
              )}
            </Link>
          ))}
          <Link href="/" target="_blank" className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-mute hover:text-gold">View store ↗</Link>
        </nav>
        <div className="hidden px-4 py-6 text-xs text-mute lg:block">
          <p className="truncate">{email}</p>
          <form action={logout}><button className="mt-2 text-gold underline underline-offset-4">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0 p-4 sm:p-8 print:p-0">{children}</div>
    </div>
  );
}
