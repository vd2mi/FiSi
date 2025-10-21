module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#000000',
          panel: '#0a0a0a',
          border: 'var(--color-accent)',
          accent: 'var(--color-accent)',
          accentDark: 'var(--color-accent)',
          text: 'var(--color-accent)',
          muted: '#6b7280',
          green: '#00ff00',
          red: '#ff0066',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 5px var(--color-accent), 0 0 10px var(--color-accent), 0 0 20px var(--color-accent)',
        'neon-sm': '0 0 2px var(--color-accent), 0 0 5px var(--color-accent)',
      }
    },
  },
  plugins: [],
}
