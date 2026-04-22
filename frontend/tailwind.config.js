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
      },
    },
  },
  plugins: [],
};
