import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // ⭐ Custom animations untuk loading yang aesthetic
      keyframes: {
        // Shimmer effect untuk button loading
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Fade in untuk smooth transitions
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slow spin untuk loading circles
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Pulse scale untuk attention
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        // Slide up untuk cards
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Gradient shift untuk backgrounds
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        fadeIn: 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin-slow 2s linear infinite',
        'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
        slideUp: 'slideUp 0.5s ease-out',
        gradient: 'gradient 3s ease infinite',
      },
      // ⭐ Custom backdrop blur
      backdropBlur: {
        xs: '2px',
      },
      // ⭐ Custom box shadows untuk depth
      boxShadow: {
        'glow-sm': '0 0 10px rgba(16, 185, 129, 0.3)',
        'glow-md': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-lg': '0 0 30px rgba(16, 185, 129, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;