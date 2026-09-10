/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#131315',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'glass-radial': 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12) 0%, rgba(24, 24, 27, 0) 70%)',
        'subtle-glow': 'radial-gradient(ellipse 600px 300px at 50% -10%, rgba(255, 255, 255, 0.06), transparent)',
        'modal-spotlight': 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), rgba(9, 9, 11, 0) 70%)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'glass-border': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'elevated-glow': '0 0 25px -5px rgba(99, 102, 241, 0.15)',
        'button-glow': '0 0 20px -2px rgba(255, 255, 255, 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 3.5s ease-in-out infinite',
        'live-ping': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'card-float': 'cardFloat 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.75))' },
        },
        cardFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
