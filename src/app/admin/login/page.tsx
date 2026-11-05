import type { Metadata } from 'next';
import LoginForm from '@/components/admin/LoginForm';
import { isAdminConfigured, isSupabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const missing: string[] = [];
  if (!isSupabaseConfigured()) missing.push('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.ADMIN_EMAILS) missing.push('ADMIN_EMAILS');

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4">
      <div className="w-full max-w-md rounded-2xl border border-gold/40 bg-coal p-8">
        <p className="gold-text text-center font-display text-2xl tracking-[0.3em]">VENORA</p>
        <h1 className="mt-2 text-center font-serif text-2xl text-ivory">Admin sign in</h1>
        {missing.length > 0 || !isAdminConfigured() ? (
          <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            <p className="font-medium">The admin area is not configured yet.</p>
            <p className="mt-1">Set these in <code>.env.local</code> and restart: {missing.join('; ') || 'all variables'}. See the README.</p>
          </div>
        ) : (
          <>
            {sp.error === 'service-key' && <p className="mt-4 text-sm text-red-400">SUPABASE_SERVICE_ROLE_KEY is missing on the server.</p>}
            <LoginForm />
          </>
        )}
      </div>
    </div>
  );
}
