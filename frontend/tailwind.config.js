/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        bg: { DEFAULT: '#08090d', 2: '#0e1018', 3: '#151824', 4: '#1c2130' },
        cyan: { DEFAULT: '#00efff' },
        green: { DEFAULT: '#00ff99' },
        red2: { DEFAULT: '#ff4d6d' },
        purple: { DEFAULT: '#7b5ea7' },
        yellow: { DEFAULT: '#ffdd57' },
        border: { DEFAULT: 'rgba(255,255,255,0.07)', 2: 'rgba(255,255,255,0.12)', 3: 'rgba(255,255,255,0.18)' },
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease',
        'fade-in': 'fadeIn 0.4s ease',
      },
      keyframes: {
        pulseDot: { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.6, transform: 'scale(1.3)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}