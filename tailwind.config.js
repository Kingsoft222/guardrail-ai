/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // This makes it tally with the phone's theme
  theme: {
    extend: {
      colors: {
        'solar-gold': '#FFD700',
        'storm-gray': '#2F4F4F',
      }
    },
  },
  plugins: [],
}