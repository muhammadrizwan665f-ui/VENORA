'use client';

import { useEffect, useState } from 'react';
import { THEMES, themeVars, getTheme } from '@/lib/themes';

/** 5 storefront themes. Selecting one previews it instantly across this admin page; "Save settings" applies it to the store. */
export default function ThemePicker({ current }: { current: string }) {
  const [sel, setSel] = useState(getTheme(current).id);

  useEffect(() => {
    const root = document.documentElement;
    const vars = themeVars(getTheme(sel));
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k);
    };
  }, [sel]);

  return (
    <section className="rounded-2xl border border-gold/25 bg-coal p-5">
      <h2 className="font-serif text-xl">Store theme</h2>
      <p className="mt-1 text-xs text-mute">Pick a look for the whole website. Click a theme to preview it here, then press “Save settings” to publish it.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => {
          const on = sel === t.id;
          const c = (v: string) => `rgb(${v})`;
          return (
            <label
              key={t.id}
              className={`block cursor-pointer overflow-hidden rounded-xl border transition ${on ? 'border-gold ring-1 ring-gold' : 'border-gold/25 hover:border-gold/60'}`}
            >
              <input type="radio" name="theme" value={t.id} checked={on} onChange={() => setSel(t.id)} className="sr-only" />
              <div className="flex h-20 items-end gap-2 p-3" style={{ background: `linear-gradient(135deg, ${c(t.vars.coal)}, ${c(t.vars.ink)})` }} aria-hidden="true">
                <span className="h-9 w-9 rounded-full" style={{ background: `linear-gradient(135deg, ${c(t.vars.goldLight)}, ${c(t.vars.gold)} 50%, ${c(t.vars.goldDeep)})` }} />
                <span className="h-2 flex-1 rounded-full" style={{ background: c(t.vars.gold), opacity: 0.8 }} />
                <span className="h-2 w-8 rounded-full" style={{ background: c(t.vars.ivory), opacity: 0.7 }} />
              </div>
              <div className="p-3">
                <p className="flex items-center justify-between text-sm text-ivory">
                  {t.name}
                  {on && <span className="text-[10px] uppercase tracking-widest text-gold">Selected</span>}
                </p>
                <p className="mt-0.5 text-xs text-mute">{t.blurb}</p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
