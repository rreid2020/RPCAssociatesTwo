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
          DEFAULT: '#0E6A4D',
          dark: '#0B3A2C',
        },
        background: '#F8FFFB',
        text: {
          DEFAULT: '#0B3A2C',
          light: '#2F6B57',
        },
        border: '#CDEFE0',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
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
        'DEFAULT': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
