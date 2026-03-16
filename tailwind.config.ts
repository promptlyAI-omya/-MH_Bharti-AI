import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: "#FF6B00",
          50: "#FFF3E6",
          100: "#FFE0BF",
          200: "#FFC480",
          300: "#FFA740",
          400: "#FF8B00",
          500: "#FF6B00",
          600: "#E05E00",
          700: "#B84D00",
          800: "#8F3C00",
          900: "#662B00",
        },
        navy: {
          DEFAULT: "#1B2A6B",
          50: "#E8EAF6",
          100: "#C5CAE9",
          200: "#9FA8DA",
          300: "#7986CB",
          400: "#5C6BC0",
          500: "#1B2A6B",
          600: "#172460",
          700: "#131D50",
          800: "#0F1740",
          900: "#0B1030",
        },
        "dark-bg": "#0F0F0F",
        "dark-card": "#1A1A1A",
        "dark-border": "#2A2A2A",
        "dark-surface": "#141414",
      },
      fontFamily: {
        sans: ['"Noto Sans Devanagari"', "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "saffron-gradient":
          "linear-gradient(135deg, #FF6B00 0%, #FF8B00 50%, #FFA740 100%)",
        "navy-gradient":
          "linear-gradient(135deg, #1B2A6B 0%, #2A3F8F 50%, #3D5AF1 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #141414 0%, #0F0F0F 100%)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-in",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 107, 0, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 107, 0, 0.6)" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
