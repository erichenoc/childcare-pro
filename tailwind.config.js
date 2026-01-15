/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colores Liquid Glass
      colors: {
        // CSS Variables based colors (shadcn compatible)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Colores primarios de la marca - Azul
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: '#0EA5E9',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        // Estados
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // Glass backgrounds - Azul claro
        glass: {
          light: 'rgba(255, 255, 255, 0.85)',
          medium: 'rgba(255, 255, 255, 0.92)',
          heavy: 'rgba(255, 255, 255, 0.98)',
          dark: {
            light: 'rgba(0, 0, 0, 0.2)',
            medium: 'rgba(0, 0, 0, 0.35)',
            heavy: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
      // Backdrop blur personalizado
      backdropBlur: {
        xs: '2px',
        sm: '6px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '30px',
        '3xl': '40px',
      },
      // Border radius para Liquid Glass
      borderRadius: {
        'glass': '20px',
        'glass-sm': '12px',
        'glass-lg': '24px',
        'glass-xl': '32px',
        'glass-full': '100px',
      },
      // Sombras personalizadas - Estilo azul limpio
      boxShadow: {
        'glass': '0 2px 12px rgba(59, 130, 246, 0.06)',
        'glass-lg': '0 4px 20px rgba(59, 130, 246, 0.08)',
        'glass-xl': '0 8px 30px rgba(59, 130, 246, 0.1)',
        'glass-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'glass-hover': '0 4px 16px rgba(59, 130, 246, 0.12)',
        'glass-glow': '0 0 24px rgba(59, 130, 246, 0.2)',
        'glass-glow-success': '0 0 24px rgba(34, 197, 94, 0.2)',
        'glass-glow-error': '0 0 24px rgba(239, 68, 68, 0.2)',
      },
      // Animaciones
      animation: {
        'glass-shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      // Transiciones
      transitionTimingFunction: {
        'glass': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Tipografía
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
