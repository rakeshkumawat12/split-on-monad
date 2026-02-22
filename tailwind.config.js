/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          card: '#16161f',
          elevated: '#1e1e2a',
        },
        accent: {
          DEFAULT: '#00e5a0',
          dim: '#00c98c',
        },
      },
    },
  },
  plugins: [],
};
