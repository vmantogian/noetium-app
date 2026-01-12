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
        // Primary brand colors
        cyan: {
          light: '#87F1FF',
          DEFAULT: '#4EA6DC',
          dark: '#113285',
        },
        magenta: {
          light: '#E32D91',
          DEFAULT: '#C830CC',
        },
        // Neutral colors
        lavender: '#E5D0E3',
        dark: '#191308',
        silver: '#D8D9DC',
        slate: '#454551',
        // Semantic aliases
        primary: {
          50: '#E6FAFF',
          100: '#CCF5FF',
          200: '#87F1FF',
          300: '#4EA6DC',
          400: '#4EA6DC',
          500: '#113285',
          600: '#0E2A6E',
          700: '#0B2157',
          800: '#081840',
          900: '#050F29',
        },
        accent: {
          50: '#FDE8F3',
          100: '#FBD1E7',
          200: '#F7A3CF',
          300: '#E32D91',
          400: '#C830CC',
          500: '#A020A0',
          600: '#801080',
          700: '#600060',
          800: '#400040',
          900: '#200020',
        },
      },
      fontFamily: {
        heading: ['"Segoe UI"', 'system-ui', 'sans-serif'],
        body: ['Aptos', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans: ['Aptos', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        heading: '600', // Semibold for headings
      },
    },
  },
  plugins: [],
}
