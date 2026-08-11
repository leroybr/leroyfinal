/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Manrope"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
        prata: ['"Prata"', 'serif'],
      },
      colors: {
        'leroy-black': '#1a1a1a',
        'leroy-gold': '#d4af37',
        'leroy-gray': '#f5f5f5',
      }
    },
  },
  plugins: [],
}