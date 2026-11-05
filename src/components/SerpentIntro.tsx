'use client';

import { useEffect, useRef, useState } from 'react';
import { createIntroScene, INTRO_DURATION, INTRO_EXIT_START } from '@/lib/serpent3d';

/**
 * Opening 3D intro: a golden serpent spirals out of the dark, locks into an ouroboros ring around the
 * VENORA logo, then the camera flies through the ring into the site. Once per browser session.
 * Tap / click / Esc skips. A CSS failsafe hides the veil even if JS fails (see globals.css).
 */
export default function SerpentIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    let skip = false;
    try {
      if (sessionStorage.getItem('venora.veil')) skip = true;
      else sessionStorage.setItem('venora.veil', '1');
    } catch {
      /* ignore */
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) skip = true;
    const canvas = canvasRef.current;
    if (skip || !canvas) {
      setDone(true);
      return;
    }

    const root = document.documentElement;
    root.classList.add('intro-lock');
    let scene: ReturnType<typeof createIntroScene>;
    try {
      scene = createIntroScene(canvas);
    } catch {
      root.classList.remove('intro-lock');
      setDone(true);
      return;
    }

    let raf = 0;
    let start = performance.now();
    let ended = false;
    let leavingSet = false;
    setRun(true);

    const finish = () => {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      root.classList.remove('intro-lock');
      setDone(true);
    };
    const loop = (now: number) => {
      const T = (now - start) / 1000;
      scene.frame(T);
      if (T >= INTRO_EXIT_START && !leavingSet) {
        leavingSet = true;
        setLeaving(true);
      }
      if (T >= INTRO_DURATION) finish();
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    skipRef.current = () => {
      const T = (performance.now() - start) / 1000;
      if (T < INTRO_EXIT_START) start = performance.now() - INTRO_EXIT_START * 1000;
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skipRef.current();
    const onResize = () => scene.resize();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      root.classList.remove('intro-lock');
    };
  }, []);

  if (done) return null;
  return (
    <div
      className={`intro-veil fixed inset-0 z-[200] overflow-hidden bg-ink ${run ? 'intro-run' : ''} ${leaving ? 'intro-leaving' : ''}`}
      onClick={() => skipRef.current()}
      role="presentation"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="intro-text flex flex-col items-center text-center">
          <span className="gold-text font-serif text-5xl font-light sm:text-7xl">VENORA</span>
          <span className="mt-1 font-display text-[10px] uppercase tracking-[0.7em] text-gold sm:text-sm">Jewelry</span>
          <span className="mt-4 font-script text-3xl text-gold/90 sm:text-5xl">Elegance With An Edge.</span>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skipRef.current();
        }}
        className="absolute bottom-6 right-6 rounded-full border border-gold/40 px-4 py-1.5 font-sans text-[10px] uppercase tracking-[0.25em] text-gold/80 transition hover:border-gold hover:text-gold"
      >
        Skip
      </button>
    </div>
  );
}
