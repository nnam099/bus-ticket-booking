/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#f57c00',
          600: '#e65100',
          700: '#bf360c',
        },
        brand: '#e85d04',
        sand: '#fdfbf7',
        peach: '#fff0e6',
        mocha: {
          DEFAULT: '#4a3b32',
          light: '#9a7d6e',
          border: '#f0e6d8',
          accent: '#f5c7a0',
          card: '#c4a898',
        },
        forest: '#2d6a4f',
      },
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
