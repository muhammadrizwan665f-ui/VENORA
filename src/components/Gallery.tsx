'use client';

import { useCallback, useEffect, useState } from 'react';
import SmartImage from './SmartImage';
import { ArrowIcon, CloseIcon } from './Icons';

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : ['/images/hero.jpg'];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const go = useCallback((d: number) => setI((x) => (x + d + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (!zoom) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = '';
    };
  }, [zoom, go]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label={`Enlarge image of ${name}`}
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-gold/30 bg-black"
      >
        <SmartImage src={list[i]} alt={`${name} — view ${i + 1}`} priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
      </button>

      {list.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {list.map((src, idx) => (
            <li key={src + idx}>
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Show image ${idx + 1}`}
                aria-current={idx === i}
                className={`relative block aspect-square w-full overflow-hidden rounded-lg border bg-black transition ${idx === i ? 'border-gold' : 'border-gold/20 opacity-70 hover:opacity-100'}`}
              >
                <SmartImage src={src} alt="" sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/95 p-4" role="dialog" aria-label={`${name} images`} onClick={() => setZoom(false)}>
          <button type="button" aria-label="Close" className="absolute right-4 top-4 grid h-12 w-12 place-items-center text-gold" onClick={() => setZoom(false)}>
            <CloseIcon width={28} height={28} />
          </button>
          {list.length > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 rotate-180 place-items-center rounded-full bg-black/60 text-gold">
                <ArrowIcon width={22} height={22} />
              </button>
              <button type="button" aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-gold">
                <ArrowIcon width={22} height={22} />
              </button>
            </>
          )}
          <div className="relative aspect-square w-full max-w-[min(90vw,85vh)]" onClick={(e) => e.stopPropagation()}>
            <SmartImage src={list[i]} alt={`${name} — view ${i + 1}`} sizes="90vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
