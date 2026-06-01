/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sap: {
          dark: '#0a0f1d',
          card: '#121829',
          border: '#1f294d',
          blue: '#134e8a',
          cyan: '#06b6d4',
          accent: '#3b82f6',
          text: '#e2e8f0',
          muted: '#94a3b8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.15)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.2)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-danger': '0 0 15px rgba(239, 68, 68, 0.15)',
      }
    },
  },
  plugins: [],
}
