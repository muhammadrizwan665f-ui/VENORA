import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Protects every /admin route (except the login page). Pages and server actions re-check with requireAdmin().
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/admin/login';

  const toLogin = () => {
    const dest = request.nextUrl.clone();
    dest.pathname = '/admin/login';
    dest.search = '';
    return NextResponse.redirect(dest);
  };

  if (!url || !anon) return isLogin ? NextResponse.next() : toLogin();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = data.user?.email?.toLowerCase();
  const isAdmin = !!email && allowed.includes(email);

  if (!isAdmin && !isLogin) return toLogin();
  if (isAdmin && isLogin && !request.nextUrl.searchParams.has('error')) {
    const dest = request.nextUrl.clone();
    dest.pathname = '/admin';
    dest.search = '';
    return NextResponse.redirect(dest);
  }
  return response;
}

export const config = { matcher: ['/admin/:path*'] };
