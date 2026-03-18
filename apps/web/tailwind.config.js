/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: '#172632',
        clay: '#c46a2f',
        deep: '#0f6a66',
        amber: '#d49a3a',
        fog: '#dce6e1'
      },
      fontFamily: {
        display: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
        body: ['Avenir Next', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        panel: '0 24px 60px rgba(23, 38, 50, 0.16)'
      }
    }
  },
  plugins: []
};