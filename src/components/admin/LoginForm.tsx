'use client';

import { useState } from 'react';
import { login } from '@/app/admin/actions';

export default function LoginForm() {
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(false);
  const start = (fn: () => Promise<void>) => { setPending(true); fn().finally(() => setPending(false)); };
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setErr('');
        start(async () => {
          const r = await login(fd); // redirects on success
          if (r?.error) setErr(r.error);
        });
      }}
    >
      <label className="block"><span className="label-lux">Email</span><input name="email" type="email" autoComplete="username" required className="input-lux" /></label>
      <label className="block"><span className="label-lux">Password</span><input name="password" type="password" autoComplete="current-password" required className="input-lux" /></label>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <button type="submit" disabled={pending} className="btn-gold w-full">{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
