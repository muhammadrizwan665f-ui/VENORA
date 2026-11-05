'use client';

import { useState, type FormEvent } from 'react';
import Reveal from './Reveal';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('busy');
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setState('ok');
      setMsg("Welcome to the Venora circle. You're on the list.");
      setEmail('');
    } catch (err) {
      setState('error');
      setMsg((err as Error).message);
    }
  }

  return (
    <section aria-labelledby="newsletter-title" className="relative overflow-hidden border-y border-gold/20 bg-coal">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(214,173,104,0.14),transparent_65%)]" />
      <Reveal className="container-x relative py-14 text-center sm:py-16">
        <p className="font-script text-3xl text-gold sm:text-4xl">Join the Venora Circle</p>
        <h2 id="newsletter-title" className="mt-1 font-display text-lg uppercase tracking-[0.25em] text-ivory sm:text-xl">
          Subscribe for Exclusive Deals
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-mute">New serpent designs, private offers and first access to limited collections.</p>
        <form onSubmit={submit} className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row" noValidate>
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input
            id="nl-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="input-lux flex-1 !rounded-full !px-5 !py-3"
          />
          <button type="submit" disabled={state === 'busy'} className="btn-gold sm:px-8">
            {state === 'busy' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
        <p role="status" className={`mt-3 min-h-[1.25rem] text-sm ${state === 'error' ? 'text-red-400' : 'text-gold'}`}>
          {msg}
        </p>
      </Reveal>
    </section>
  );
}
