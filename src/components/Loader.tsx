'use client';

import { useEffect, useState } from 'react';

/** Luxury page-load veil. CSS auto-hides it after ~2.4s even if JS fails; repeat visits in a session skip it. */
export default function Loader() {
  const [skip, setSkip] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('venora.veil')) setSkip(true);
      else sessionStorage.setItem('venora.veil', '1');
    } catch {
      /* ignore */
    }
  }, []);
  if (skip) return null;
  return (
    <div className="loader-veil fixed inset-0 z-[200] grid place-items-center bg-ink" aria-hidden="true">
      <div className="flex flex-col items-center gap-5">
        <svg viewBox="0 0 120 60" className="h-16 w-32" fill="none" stroke="#D6AD68" strokeWidth="1.6" strokeLinecap="round">
          <path
            d="M6 36c12-22 26-22 34-8s20 14 30-2 22-18 44-4"
            strokeDasharray="400"
            className="animate-draw"
            style={{ strokeDashoffset: 400 }}
          />
          <circle cx="114" cy="22" r="2.6" fill="#D6AD68" stroke="none" className="animate-pulseGlow" />
        </svg>
        <p className="gold-text animate-pulseGlow font-display text-2xl tracking-[0.45em]">VENORA</p>
        <p className="font-display text-[9px] uppercase tracking-[0.7em] text-gold/70">Jewelry</p>
      </div>
    </div>
  );
}
