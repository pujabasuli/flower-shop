import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-rose': 'linear-gradient(135deg, hsl(340,70%,92%), hsl(350,50%,96%))',
        'gradient-sage': 'linear-gradient(135deg, hsl(140,25%,90%), hsl(140,20%,95%))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        rose: {
          DEFAULT: 'hsl(var(--rose))',
          soft: 'hsl(350, 50%, 92%)',
          50: 'hsl(350, 60%, 96%)',
          100: 'hsl(350, 55%, 92%)',
          200: 'hsl(350, 50%, 86%)',
          300: 'hsl(350, 55%, 78%)',
          400: 'hsl(340, 60%, 68%)',
          500: 'hsl(340, 70%, 58%)',
          600: 'hsl(340, 65%, 48%)',
          700: 'hsl(340, 60%, 40%)',
        },
        cream: {
          DEFAULT: 'hsl(40, 50%, 96%)',
          50: 'hsl(40, 60%, 99%)',
          100: 'hsl(40, 50%, 96%)',
          200: 'hsl(40, 45%, 92%)',
        },
        sage: {
          DEFAULT: 'hsl(var(--sage))',
          50: 'hsl(140, 25%, 95%)',
          100: 'hsl(140, 25%, 90%)',
          200: 'hsl(140, 25%, 80%)',
          300: 'hsl(140, 30%, 65%)',
          400: 'hsl(140, 30%, 50%)',
          500: 'hsl(140, 35%, 40%)',
          600: 'hsl(140, 35%, 32%)',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      boxShadow: {
        soft: '0 4px 24px -8px hsl(340 40% 60% / 0.18)',
        'soft-lg': '0 12px 40px -12px hsl(340 40% 60% / 0.25)',
        glow: '0 0 24px hsl(340 70% 70% / 0.3)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
