/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          card: 'var(--color-surface-card)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          muted: 'var(--color-accent-muted)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: 'var(--color-border)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
    },
  },
  plugins: [],
};
