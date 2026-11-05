'use client';

import { useCallback, useRef } from 'react';

/** 3D hover tilt + moving glare for mouse users (touch and reduced-motion are left alone). */
export function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T>(null);
  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el || e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transition = 'transform 90ms linear, border-color .5s, box-shadow .5s';
      el.style.transform = `perspective(900px) rotateY(${((px - 0.5) * max).toFixed(2)}deg) rotateX(${((0.5 - py) * max).toFixed(2)}deg) translateY(-4px)`;
      el.style.setProperty('--gx', `${(px * 100).toFixed(0)}%`);
      el.style.setProperty('--gy', `${(py * 100).toFixed(0)}%`);
    },
    [max],
  );
  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1), border-color .5s, box-shadow .5s';
    el.style.transform = '';
  }, []);
  return { ref, onPointerMove, onPointerLeave };
}
