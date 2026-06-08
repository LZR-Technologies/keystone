import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      /* LZR Design System v1.3 — design.lzrtechnologies.com/greencopilot */
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        border: 'var(--border)',
        'border-hi': 'var(--border-hi)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        'text-inv': 'var(--text-inv)',
        accent: {
          DEFAULT: 'var(--accent)',
          hi: 'var(--accent-hi)',
          lo: 'var(--accent-lo)',
          bg: 'var(--accent-bg)',
          bd: 'var(--accent-bd)',
          glow: 'var(--accent-glow)',
        },
        accent2: {
          DEFAULT: 'var(--accent2)',
          hi: 'var(--accent2-hi)',
          lo: 'var(--accent2-lo)',
          bg: 'var(--accent2-bg)',
          bd: 'var(--accent2-bd)',
          glow: 'var(--accent2-glow)',
        },
        ok: { DEFAULT: 'var(--ok)', bg: 'var(--ok-bg)', bd: 'var(--ok-bd)' },
        warn: { DEFAULT: 'var(--warn)', bg: 'var(--warn-bg)', bd: 'var(--warn-bd)' },
        err: { DEFAULT: 'var(--err)', bg: 'var(--err-bg)', bd: 'var(--err-bd)' },
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)', bd: 'var(--info-bd)' },
        dv: {
          1: 'var(--dv-1)',
          2: 'var(--dv-2)',
          3: 'var(--dv-3)',
          4: 'var(--dv-4)',
          5: 'var(--dv-5)',
          6: 'var(--dv-6)',
          7: 'var(--dv-7)',
          8: 'var(--dv-8)',
        },
      },
      fontFamily: {
        sans: ['var(--font)'],
        mono: ['var(--mono)'],
        display: ['var(--display)'],
      },
      spacing: {
        s1: 'var(--s1)',
        s2: 'var(--s2)',
        s3: 'var(--s3)',
        s4: 'var(--s4)',
        s5: 'var(--s5)',
        s6: 'var(--s6)',
        s7: 'var(--s7)',
        s8: 'var(--s8)',
        s9: 'var(--s9)',
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        full: 'var(--r-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        accent: 'var(--shadow-accent)',
      },
      backgroundImage: {
        'grad-brand': 'var(--grad-brand)',
        'grad-surface': 'var(--grad-surface)',
        'grad-accent': 'var(--grad-accent)',
        'grad-hero': 'var(--grad-hero)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
        spring: 'var(--ease-spring)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
    },
  },
  plugins: [],
}

export default config
