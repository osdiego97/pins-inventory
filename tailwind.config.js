/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          elevated: '#1a1a1a',
          card: '#242424',
        },
        accent: {
          DEFAULT: '#e8c97e',
          muted: '#b89a5a',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#a0a0a0',
          muted: '#606060',
        },
        danger: '#e05c5c',
        success: '#5ce07a',
      },
    },
  },
  plugins: [],
};
