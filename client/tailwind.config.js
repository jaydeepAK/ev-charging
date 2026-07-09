/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Electric green — same slot as before ("brand"), so every existing
        // bg-brand-600 / text-brand-600 / border-brand-* class in the app
        // picks up the refined EV-energy shade automatically, no JSX changes.
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
        },
        // Deep navy — for headings, hero gradients, dark surfaces
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          400: '#486581',
          600: '#243b53',
          700: '#1a2c42',
          800: '#102a43',
          900: '#0a1929',
        },
        // Lime/yellow accent — sparingly, for highlights and a chart accent color
        accent: {
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.45s ease-out both',
      },
    },
  },
  plugins: [],
};
