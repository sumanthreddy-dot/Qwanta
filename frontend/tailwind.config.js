/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // QWANTA Design System — Modern Maritime Tech (Option 1)
        // Ratio: 60% Crisp White & Ice / 30% Midnight Navy / 10% Cobalt & Cyan & Emerald
        canvas: {
          DEFAULT: '#FFFFFF',
          ice:     '#F8FAFC',
          subtle:  '#EFF6FF',
          border:  '#C5D5EE',
        },
        navy: {
          DEFAULT: '#0A1628',
          deep:    '#060D19',
          sidebar: '#0D1B2A',
          slate:   '#0F172A',
          border:  'rgba(37, 99, 235, 0.16)',
        },
        cobalt: {
          DEFAULT: '#2563EB',
          hover:   '#1D4ED8',
          light:   '#3B82F6',
          pale:    '#93C5FD',
        },
        cyan: {
          DEFAULT: '#0284C7',
          bright:  '#06B6D4',
          light:   '#38BDF8',
          pale:    '#BAE6FD',
        },
        emerald: {
          DEFAULT: '#10B981',
          dark:    '#059669',
          light:   '#34D399',
          subtle:  'rgba(16, 185, 129, 0.12)',
        },
        slate: {
          primary:   '#0F172A',
          secondary: '#64748B',
          muted:     '#94A3B8',
        },
        // Backward compatibility tokens for existing classes
        white: {
          DEFAULT: '#FFFFFF',
          warm:    '#FFFFFF',
          muted:   '#EFF6FF',
          dim:     '#C5D5EE',
        },
        blue: {
          DEFAULT: '#2563EB',
          soft:    '#3B82F6',
          light:   '#60A5FA',
          dark:    '#1D4ED8',
        },
        'line-beige':  '#C5D5EE',
        'ivory-warm':  '#FFFFFF',
        'ivory-muted': '#EFF6FF',
        'ivory':       '#FFFFFF',
        q: {
          bg:          '#FFFFFF',
          surface:     '#FFFFFF',
          elevated:    '#EFF6FF',
          border:      '#C5D5EE',
          text:        '#0F172A',
          muted:       '#64748B',
          accent:      '#2563EB',
          'accent-soft':'#3B82F6',
          dark:        '#0A1628',
          'dark-2':    '#0D1B2A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cobalt-sm':  '0 0 12px -2px rgba(37, 99, 235, 0.25)',
        'cobalt-md':  '0 0 24px -4px rgba(37, 99, 235, 0.35)',
        'cyan-sm':    '0 0 12px -2px rgba(6, 182, 212, 0.25)',
        'card':       '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'inset-top':  'inset 0 1px 0 rgba(255,255,255,0.9)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.22,1,0.36,1)',
        'wave-slow':  'wave 8s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        wave:      { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseSoft: { '0%,100%': { opacity: '0.7' }, '50%': { opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      }
    },
  },
  plugins: [],
}
