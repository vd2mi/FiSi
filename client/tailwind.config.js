/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0a0f',
          panel: '#16151d',
          border: '#2d2b3a',
          accent: '#8b5cf6',
          accentDark: '#7c3aed',
          text: '#e5e7eb',
          muted: '#9ca3af',
          green: '#10b981',
          red: '#ef4444',
        }
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
