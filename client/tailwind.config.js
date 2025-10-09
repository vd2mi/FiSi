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
          border: '#00ff41',
          accent: '#00ff41',
          accentDark: '#00cc33',
          text: '#00ff41',
          muted: '#00aa2e',
          green: '#00ff41',
          red: '#ff0055',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 20px #00ff41',
        'neon-sm': '0 0 2px #00ff41, 0 0 5px #00ff41',
      }
    },
  },
  plugins: [],
}
