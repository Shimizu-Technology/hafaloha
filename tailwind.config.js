/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hafaloha brand colors
        'hafaloha-red': '#C1191F',
        'hafaloha-gold': '#FFD700',
      },
    },
  },
  plugins: [],
}

