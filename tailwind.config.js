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
      // Colores Neumorphism
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
        // Colores primarios de la marca - Azul (mantenidos)
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
        // Neumorphism colors
        neu: {
          // Light mode
          bg: '#e6e7ee',
          dark: '#b8b9be',
          light: '#ffffff',
          // Dark mode
          'bg-dark': '#2d2d2d',
          'dark-dark': '#1a1a1a',
          'light-dark': '#404040',
          // Variantes de fondo
          'bg-warm': '#e0e5ec',
          'bg-cool': '#f2f3f9',
          'bg-blue': '#e3edf7',
        },
      },
      // Border radius para Neumorphism
      borderRadius: {
        'neu': '20px',
        'neu-sm': '12px',
        'neu-lg': '24px',
        'neu-xl': '32px',
        'neu-full': '100px',
      },
      // Sombras Neumorphism
      boxShadow: {
        // Light mode - Raised (elevado)
        'neu-xs': '2px 2px 4px #b8b9be, -2px -2px 4px #ffffff',
        'neu-sm': '3px 3px 6px #b8b9be, -3px -3px 6px #ffffff',
        'neu': '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
        'neu-md': '8px 8px 16px #b8b9be, -8px -8px 16px #ffffff',
        'neu-lg': '12px 12px 24px #b8b9be, -12px -12px 24px #ffffff',
        'neu-xl': '20px 20px 40px #b8b9be, -20px -20px 40px #ffffff',
        // Light mode - Inset (hundido)
        'neu-inset-xs': 'inset 2px 2px 4px #b8b9be, inset -2px -2px 4px #ffffff',
        'neu-inset-sm': 'inset 3px 3px 6px #b8b9be, inset -3px -3px 6px #ffffff',
        'neu-inset': 'inset 4px 4px 8px #b8b9be, inset -4px -4px 8px #ffffff',
        'neu-inset-md': 'inset 6px 6px 12px #b8b9be, inset -6px -6px 12px #ffffff',
        'neu-inset-lg': 'inset 8px 8px 16px #b8b9be, inset -8px -8px 16px #ffffff',
        // Dark mode - Raised
        'neu-dark-sm': '3px 3px 6px #1a1a1a, -3px -3px 6px #404040',
        'neu-dark': '6px 6px 12px #1a1a1a, -6px -6px 12px #404040',
        'neu-dark-lg': '12px 12px 24px #1a1a1a, -12px -12px 24px #404040',
        // Dark mode - Inset
        'neu-dark-inset': 'inset 4px 4px 8px #1a1a1a, inset -4px -4px 8px #404040',
        'neu-dark-inset-sm': 'inset 3px 3px 6px #1a1a1a, inset -3px -3px 6px #404040',
        // Estado activo/pressed
        'neu-pressed': 'inset 2px 2px 5px #b8b9be, inset -2px -2px 5px #ffffff',
        'neu-dark-pressed': 'inset 2px 2px 5px #1a1a1a, inset -2px -2px 5px #404040',
        // Glow effects para estados
        'neu-glow-primary': '0 0 20px rgba(59, 130, 246, 0.3), 6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
        'neu-glow-success': '0 0 20px rgba(34, 197, 94, 0.3), 6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
        'neu-glow-warning': '0 0 20px rgba(245, 158, 11, 0.3), 6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
        'neu-glow-error': '0 0 20px rgba(239, 68, 68, 0.3), 6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
      },
      // Animaciones
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
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
        'neu': 'cubic-bezier(0.4, 0, 0.2, 1)',
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
