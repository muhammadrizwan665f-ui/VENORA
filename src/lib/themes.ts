/** Storefront colour themes. Admin → Settings → Theme picks one; values are "R G B" channels so Tailwind opacity works. */
export type Theme = {
  id: string;
  name: string;
  blurb: string;
  vars: { ink: string; coal: string; gold: string; goldDeep: string; goldLight: string; ivory: string; mute: string; heroFilter: string };
};

export const THEMES: Theme[] = [
  {
    id: 'noir-gold',
    name: 'Noir Gold',
    blurb: 'The signature look: black with antique gold.',
    vars: { ink: '5 5 5', coal: '17 16 14', gold: '214 173 104', goldDeep: '184 138 69', goldLight: '246 224 176', ivory: '245 240 232', mute: '169 160 150', heroFilter: 'none' },
  },
  {
    id: 'emerald-royale',
    name: 'Emerald Royale',
    blurb: 'Deep forest green with champagne gold.',
    vars: { ink: '3 10 8', coal: '10 27 21', gold: '212 180 118', goldDeep: '168 134 76', goldLight: '240 222 176', ivory: '240 245 240', mute: '150 170 160', heroFilter: 'none' },
  },
  {
    id: 'burgundy-velvet',
    name: 'Burgundy Velvet',
    blurb: 'Rich wine-red velvet with warm antique gold.',
    vars: { ink: '14 5 8', coal: '40 13 21', gold: '214 170 112', goldDeep: '170 124 70', goldLight: '244 216 172', ivory: '248 238 232', mute: '182 158 152', heroFilter: 'none' },
  },
  {
    id: 'platinum-noir',
    name: 'Platinum Noir',
    blurb: 'Graphite and silver. Cool, modern and minimal.',
    vars: { ink: '8 8 10', coal: '24 24 28', gold: '205 209 217', goldDeep: '140 146 158', goldLight: '238 240 245', ivory: '244 245 247', mute: '150 153 160', heroFilter: 'grayscale(0.9) contrast(1.05)' },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    blurb: 'Warm blush and rose gold on soft dark mauve.',
    vars: { ink: '12 7 8', coal: '32 19 20', gold: '226 170 150', goldDeep: '178 112 92', goldLight: '250 222 208', ivory: '250 242 238', mute: '180 160 156', heroFilter: 'hue-rotate(-14deg) saturate(1.05) sepia(0.15)' },
  },
];

export const DEFAULT_THEME = 'noir-gold';
export const getTheme = (id?: string | null): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];
export const isThemeId = (id: unknown): id is string => typeof id === 'string' && THEMES.some((t) => t.id === id);

/** CSS custom properties for a theme, as a plain object (used for live preview) … */
export function themeVars(t: Theme): Record<string, string> {
  const v = t.vars;
  return { '--c-ink': v.ink, '--c-coal': v.coal, '--c-gold': v.gold, '--c-gold-deep': v.goldDeep, '--c-gold-light': v.goldLight, '--c-ivory': v.ivory, '--c-mute': v.mute, '--hero-filter': v.heroFilter };
}
/** … and as a :root rule for server rendering. All values are static strings from this file. */
export function themeCss(id?: string | null): string {
  return `:root{${Object.entries(themeVars(getTheme(id))).map(([k, v]) => `${k}:${v}`).join(';')}}`;
}
