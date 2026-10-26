/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Satark Saathi Master Brand Identity
        midnight: {
          DEFAULT: '#142A36',
          dark: '#0E1E27',
          surface: '#1A3342',
          border: '#244356',
        },
        trust: {
          DEFAULT: '#176B58',
          hover: '#135948',
          active: '#0F473A',
          sage: '#DCEDE5',
          border: '#B8DED0',
        },
        canvas: {
          DEFAULT: '#F7F8F4', // Warm Ivory
          warm: '#F7F8F4',
          card: '#FFFFFF',
        },
        sage: {
          DEFAULT: '#DCEDE5', // Soft Sage
          100: '#EEF7F2',
          200: '#DCEDE5',
          300: '#C2E0D3',
        },
        // Legacy brand token compatibility
        brand: {
          navy: '#142A36',      // Midnight Ink
          navyDark: '#0E1E27',
          teal: '#176B58',      // Trust Green
          tealHover: '#135948',
          tealLight: '#DCEDE5', // Soft Sage
          tealBorder: '#B8DED0',
          sage: '#DCEDE5',
          ivory: '#F7F8F4',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
          subtle: '#F7F8F4',   // Warm Ivory
          muted: '#F1F3EE',
          border: '#E2E8F0',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        ink: {
          900: '#142A36',      // Midnight Ink
          800: '#1B2E3C',
          700: '#334756',
          600: '#475B6B',
          500: '#64748B',      // Secondary text
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',      // Border
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        teal: {
          DEFAULT: '#176B58',
          50: '#F0FDFA',
          100: '#DCEDE5',
          200: '#B8DED0',
          500: '#176B58',
          600: '#176B58',
          700: '#135948',
          800: '#0F473A',
          900: '#0B352B',
        },
        // Semantic Threat & Risk Colors (Strictly Separated from Brand)
        threat: {
          safe: '#15803D',
          safeBg: '#F0FDF4',
          safeBorder: '#BBF7D0',
          caution: '#B45309',
          cautionAmber: '#D69B36',
          cautionBg: '#FFFBEB',
          cautionBorder: '#FDE68A',
          danger: '#B91C1C',
          dangerBg: '#FEF2F2',
          dangerBorder: '#FECACA',
          critical: '#991B1B',
          criticalBg: '#FEF2F2',
          criticalBorder: '#F87171',
          info: '#1D4ED8',
          infoBg: '#EFF6FF',
          infoBorder: '#BFDBFE',
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
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(20, 42, 54, 0.04)',
        card: '0 1px 3px 0 rgba(20, 42, 54, 0.05), 0 1px 2px -1px rgba(20, 42, 54, 0.04)',
        dropdown: '0 4px 12px 0 rgba(20, 42, 54, 0.08), 0 2px 4px -1px rgba(20, 42, 54, 0.04)',
        modal: '0 20px 25px -5px rgba(20, 42, 54, 0.1), 0 8px 10px -6px rgba(20, 42, 54, 0.05)',
      }
    },
  },
  plugins: [],
}
