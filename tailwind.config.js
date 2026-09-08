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
          soft: '#0b3161',
        },
        accent: {
          DEFAULT: '#b0632c',
          dark: '#9a5624',
          soft: '#fdf4ec',
        },
        background: {
          DEFAULT: '#f4f7fa',
          band: '#eaf0f6',
        },
        text: {
          DEFAULT: '#16202c',
          body: '#3d4a58',
          light: '#6b7a89',
        },
        border: '#dfe5ec',
        ok: '#1e6b3c',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        serif: ['Georgia', '"Iowan Old Style"', '"Times New Roman"', 'serif'],
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
        'DEFAULT': '4px',
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
