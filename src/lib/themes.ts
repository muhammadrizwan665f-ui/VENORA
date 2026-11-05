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
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    blurb: 'Deep navy night with icy platinum-blue accents.',
    vars: { ink: '3 6 16', coal: '10 17 36', gold: '143 184 255', goldDeep: '74 118 201', goldLight: '220 234 255', ivory: '238 243 252', mute: '148 160 184', heroFilter: 'hue-rotate(175deg) saturate(0.9)' },
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    blurb: 'Soft rose-gold glow on a warm dark plum.',
    vars: { ink: '11 5 8', coal: '28 14 19', gold: '232 164 155', goldDeep: '183 110 121', goldLight: '255 222 214', ivory: '250 240 238', mute: '176 156 156', heroFilter: 'hue-rotate(-30deg) saturate(0.85)' },
  },
  {
    id: 'emerald-royale',
    name: 'Emerald Royale',
    blurb: 'Dark forest green with bright emerald highlights.',
    vars: { ink: '2 10 7', coal: '8 25 19', gold: '88 201 154', goldDeep: '38 138 100', goldLight: '196 244 222', ivory: '238 248 242', mute: '146 170 158', heroFilter: 'hue-rotate(100deg) saturate(0.9)' },
  },
  {
    id: 'burgundy-velvet',
    name: 'Burgundy Velvet',
    blurb: 'Wine-red velvet with warm copper-gold details.',
    vars: { ink: '12 4 7', coal: '34 10 18', gold: '222 160 108', goldDeep: '168 96 52', goldLight: '247 214 176', ivory: '248 238 230', mute: '178 156 148', heroFilter: 'hue-rotate(-12deg) saturate(1.05)' },
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
