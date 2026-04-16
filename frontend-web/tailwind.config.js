/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'srms-primary-950': '#080f20',
        'srms-primary-900': '#0f172a',
        'srms-primary-800': '#1e2f6e',
        'srms-primary-700': '#1e3a8a',
        'srms-primary-600': '#1d4ed8',
      },
      fontFamily: {
        heading: ['system-ui', 'sans-serif'],
        body: ['system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
        mono: ['Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};