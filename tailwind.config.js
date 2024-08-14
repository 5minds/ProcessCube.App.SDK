/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/components/**/*.{js,ts,jsx,tsx,mdx}'],
  prefix: 'app-sdk-',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      boxShadow: {
        'app-sdk-dark': '0 0 0px 0.2rem rgb(0 123 255 / 25%)',
        'app-sdk-dark-invalid': '0 0 0 0.2rem rgb(220 53 69 / 25%)',
      },
      colors: {
        '5minds-orange': '#f7a823',
        '5minds-orange-light': '#f9b745',
        '5minds-secondary': '#9ca3af',
        '5minds-secondary-light': '#a8b1bf',
        'app-sdk-inherit': 'inherit',
        'app-sdk-gray': {
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
        'app-sdk-dropdown-dark':
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23FFFFFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
      },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
  darkMode: ['class', "[class~='dark']"],
  safelist: [
    'asdk-pii-flow-node-instance-state--finished',
    'asdk-pii-flow-node-instance-state--running',
    'asdk-pii-flow-node-instance-state--error',
    'asdk-pii-flow-node-instance-state--terminated',
    'asdk-pii-flow-node-instance-state--canceled',
    'asdk-pii-play-button',
    // { pattern: /asdk-pii-flow-node-instance-state--[a-zA-Z]+/ },
  ],
};
