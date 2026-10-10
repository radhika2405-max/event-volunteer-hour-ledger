/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dbe4f4',
          200: '#bccfea',
          300: '#91b3dd',
          400: '#5e91cc',
          500: '#3b74ba',
          600: '#2b5ca0',
          700: '#234a82',
          800: '#1e3a68',
          900: '#0f172a',
          950: '#090d1a',
        },
        gold: {
          50: '#fdf9ee',
          100: '#fbf0d4',
          200: '#f6dfa9',
          300: '#f0c774',
          400: '#e8ac42',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
