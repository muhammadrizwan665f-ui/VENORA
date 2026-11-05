import 'server-only';
import { redirect } from 'next/navigation';
import { createAuthClient } from './supabase/server';
import { isAdminConfigured, isSupabaseConfigured } from './supabase/env';

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email?: string | null) => !!email && adminEmails().includes(email.toLowerCase());

/** Returns the signed-in admin's email, or null. */
export async function getAdminEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser(); // validates the JWT with Supabase
  const email = data.user?.email ?? null;
  return isAdminEmail(email) ? email : null;
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect('/admin/login');
  if (!isAdminConfigured()) redirect('/admin/login?error=service-key');
  return email;
}
