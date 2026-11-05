'use client';

import { useEffect, useRef } from 'react';
import { createHeroScene } from '@/lib/serpent3d';

/** Interactive 3D serpent + gold dust over the hero. Follows the cursor/finger, patrols when idle.
 *  Also drives --px/--py (−1…1) on the hero for CSS parallax. */
export default function HeroScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let scene: ReturnType<typeof createHeroScene>;
    try {
      scene = createHeroScene(canvas);
    } catch {
      return;
    }
    let raf = 0;
    let lastT = performance.now();
    let visible = true;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) {
        scene.setPointer(null, null);
        return;
      }
      scene.setPointer(x, y);
      tx = (x / r.width - 0.5) * 2;
      ty = (y / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      scene.setPointer(null, null);
      tx = 0;
      ty = 0;
    };
    const loop = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;
      if (visible && !document.hidden) {
        scene.frame(dt);
        cx += (tx - cx) * 0.06;
        cy += (ty - cy) * 0.06;
        host.style.setProperty('--px', cx.toFixed(3));
        host.style.setProperty('--py', cy.toFixed(3));
      }
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 });
    io.observe(host);
    const onResize = () => scene.resize();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onLeave, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onLeave);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] h-full w-full" />;
}
