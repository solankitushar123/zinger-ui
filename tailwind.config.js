/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#00b14f',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        zinger: {
          green:  '#00b14f',
          yellow: '#f8c916',
          dark:   '#0f1111',
          gray:   '#f4f4f4',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in-right':  'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in',
        'fade-in':         'fadeIn 0.2s ease-out',
        'bounce-in':       'bounceIn 0.4s ease-out',
        'pulse-green':     'pulseGreen 2s ease-in-out infinite',
        'float':           'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideInRight:  { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        slideOutRight: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(100%)' } },
        fadeIn:        { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        bounceIn:      { '0%': { transform: 'scale(0.8)', opacity: '0' }, '60%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseGreen:    { '0%,100%': { boxShadow: '0 0 0 0 rgba(0,177,79,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(0,177,79,0)' } },
        float:         { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md': '0 4px 16px 0 rgba(0,0,0,0.10)',
        'green':   '0 4px 14px 0 rgba(0,177,79,0.35)',
      },
    },
  },
  plugins: [],
}
