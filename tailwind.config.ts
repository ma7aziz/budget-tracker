import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
        ink: '#1b2a24',
        paper: '#f7f1e7',
        surface: '#fff9f1',
        saffron: '#f2b441',
        coral: '#e0524d',
        primary: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5fe9ce',
          400: '#2dd4b8',
          500: '#14b8a0',
          600: '#0f6b5a',
          700: '#107869',
          800: '#115e54',
          900: '#134e45',
        },
        gray: {
          50: '#faf6ef',
          100: '#f3ede4',
          200: '#e4d9c8',
          300: '#d1c2ad',
          400: '#b49c86',
          500: '#8f7b66',
          600: '#74614f',
          700: '#5b4b3e',
          800: '#43362f',
          900: '#2f2621',
          950: '#1c1512',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
