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
        'hafaloha-red': '#B31B1B',
        'hafaloha-red-dark': '#8B1515',
        'hafaloha-gold': '#FFD700',
        'hafaloha-cream': '#FFF8E7',
        'hafaloha-dark': '#1a1a2e',
      },
      fontFamily: {
        'sans': ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        'display': ['Satoshi', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

