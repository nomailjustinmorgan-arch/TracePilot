/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base: {
          950: '#0a0e14',
          900: '#0d1220',
          850: '#111827',
          800: '#161d2e',
          700: '#1e293b',
          600: '#283548',
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        electric: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0,0,0,0.2)',
        card: '0 2px 8px -2px rgba(0,0,0,0.3), 0 1px 4px -1px rgba(0,0,0,0.2)',
        elevated: '0 8px 24px -4px rgba(0,0,0,0.4), 0 2px 8px -2px rgba(0,0,0,0.25)',
        glow: '0 0 20px -4px rgba(45, 212, 191, 0.15)',
      },
    },
  },
  plugins: [],
};
