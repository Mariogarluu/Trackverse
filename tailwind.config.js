/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'media', // or 'class' if you want manual toggling
  theme: {
    extend: {
      colors: {
        primary: '#26C6DA',
        secondary: '#00695C',
        accent: '#D4AF37',
        background: {
          light: '#F8FAFC', // Slate 50
          dark: '#0F172A',  // Slate 900
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
