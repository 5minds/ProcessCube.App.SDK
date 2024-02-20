/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: {
        'dynamicui-dark': '0 0 0px 0.2rem rgb(0 123 255 / 25%)',
        'dynamicui-dark-invalid': '0 0 0 0.2rem rgb(220 53 69 / 25%)',
      },
      colors: {
        'dynamicui-gray': {
          50: '#cdcdcd',
          100: '#c3c3c3',
          150: '#a5a5a5',
          200: '#9e9d9d',
          250: '#7d7d7d',
          300: '#5d5d5d',
          350: '#555',
          400: '#4b4b4b',
          500: '#2c2c2c',
          600: '#232323',
          700: '#1d1d1d',
        },
      },
      backgroundImage: {
        'dynamicui-dropdown-dark':
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23FFFFFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
  darkMode: 'class',
};
