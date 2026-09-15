/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00204a',
          dark: '#001737',
          soft: '#052e63',
        },
        accent: {
          DEFAULT: '#0e7c86',
          dark: '#0b656d',
          soft: '#e6f2f3',
        },
        flag: {
          DEFAULT: '#8a5a00',
          soft: '#fdf4e3',
        },
        background: {
          DEFAULT: '#f6f8fb',
          band: '#eef3f9',
        },
        text: {
          DEFAULT: '#12202f',
          body: '#4c5c6d',
          light: '#4c5c6d',
        },
        border: '#d9e1ea',
        ok: '#0e7c86',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Georgia', '"Times New Roman"', 'serif'],
      },
      spacing: {
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        'xxl': '4rem',
      },
      borderRadius: {
        'DEFAULT': '6px',
        'lg': '8px',
        'xl': '12px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 32, 74, 0.07)',
        'md': '0 4px 8px rgba(0, 32, 74, 0.08)',
        'lg': '0 8px 16px rgba(0, 32, 74, 0.1)',
      },
    },
  },
  plugins: [],
}
