/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#14243A',
          navyDark: '#0D1726',
          teal: '#176B58',
          tealHover: '#135948',
          tealLight: '#E8F5EF',
          tealBorder: '#C2E5D6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F6F8FB',
          muted: '#EEF2F6',
          border: '#E2E8F0',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        ink: {
          900: '#14243A',
          800: '#182536',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        teal: {
          DEFAULT: '#176B58',
          50: '#F0FDFA',
          100: '#E8F5EF',
          200: '#C2E5D6',
          500: '#176B58',
          600: '#176B58',
          700: '#135948',
          800: '#0F473A',
          900: '#0B352B',
        },
        threat: {
          safe: '#15803D',
          safeBg: '#F0FDF4',
          safeBorder: '#BBF7D0',
          caution: '#B45309',
          cautionBg: '#FFFBEB',
          cautionBorder: '#FDE68A',
          danger: '#B91C1C',
          dangerBg: '#FEF2F2',
          dangerBorder: '#FECACA',
          critical: '#991B1B',
          criticalBg: '#FEF2F2',
          criticalBorder: '#F87171',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        card: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.06)',
        dropdown: '0 4px 12px 0 rgba(16, 24, 40, 0.08), 0 2px 4px -1px rgba(16, 24, 40, 0.06)',
      }
    },
  },
  plugins: [],
}
