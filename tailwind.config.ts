import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        coal: 'rgb(var(--c-coal) / <alpha-value>)',
        gold: { DEFAULT: 'rgb(var(--c-gold) / <alpha-value>)', deep: 'rgb(var(--c-gold-deep) / <alpha-value>)', light: 'rgb(var(--c-gold-light) / <alpha-value>)' },
        ivory: 'rgb(var(--c-ivory) / <alpha-value>)',
        mute: 'rgb(var(--c-mute) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        script: ['var(--font-script)', 'cursive'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        draw: { '0%': { strokeDashoffset: '400' }, '100%': { strokeDashoffset: '0' } },
        pulseGlow: { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
        slowZoom: { '0%': { transform: 'scale(1)' }, '100%': { transform: 'scale(1.06)' } },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
        fadeUp: 'fadeUp 0.9s cubic-bezier(.2,.7,.2,1) both',
        shimmer: 'shimmer 6s linear infinite',
        draw: 'draw 2.2s ease-in-out forwards',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        slowZoom: 'slowZoom 18s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;
