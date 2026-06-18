/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17201a',
        palm: '#1f7a4d',
        gold: '#d99a29',
        clay: '#b75d3a',
      },
    },
  },
  plugins: [],
}

