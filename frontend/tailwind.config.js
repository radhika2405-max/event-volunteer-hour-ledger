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
          50: '#fdfbf0',
          100: '#faf4d8',
          200: '#f5e8b0',
          300: '#edd47e',
          400: '#e5b842', // Adikala Signature Gold
          500: '#d4a017',
          600: '#b8820c',
          700: '#92610b',
          800: '#764d0f',
          900: '#462b08',
        },
        adikala: {
          darkest: '#08090e',
          dark: '#0e111a',
          surface: '#141824',
          card: '#1a1f30',
          border: 'rgba(229, 184, 66, 0.22)',
          gold: '#E5B842',
          goldGlow: 'rgba(229, 184, 66, 0.45)',
          goldLight: '#FBE8A6',
          goldDark: '#B88B1E',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
