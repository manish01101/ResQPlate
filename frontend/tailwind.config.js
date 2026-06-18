/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      colors: {
        primary: {
          light: '#D1FAE5', // emerald-100
          DEFAULT: '#10B981', // emerald-500
          dark: '#059669', // emerald-600
        }
      }
    },
  },
  plugins: [],
}