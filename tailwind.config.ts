import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutify: {
          bg: "#09090B",
          card: "#111113",
          elevated: "#1A1A1E",
          sidebar: "#0D0D12",
          gold: {
            DEFAULT: "#FFAB00",
            light: "#FFD700",
            dark: "#CC8800",
          },
          text: {
            primary: "#E4E4E8",
            secondary: "rgba(255,255,255,0.4)",
            muted: "rgba(255,255,255,0.2)",
          },
          border: {
            DEFAULT: "rgba(255,255,255,0.06)",
            gold: "rgba(255,171,0,0.15)",
          },
          success: "#00E5A0",
          danger: "#FF4444",
          warning: "#FFD700",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-montserrat)", "sans-serif"],
      },
      boxShadow: {
        "gold-glow": "0 0 30px rgba(255,171,0,0.15)",
        "gold-glow-lg": "0 0 60px rgba(255,171,0,0.25)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #FFD700 0%, #FFAB00 50%, #CC8800 100%)",
        "gold-text-gradient":
          "linear-gradient(180deg, #FFD700 0%, #FFAB00 50%, #CC8800 100%)",
      },
      animation: {
        "aurora-1": "aurora1 20s ease-in-out infinite",
        "aurora-2": "aurora2 25s ease-in-out infinite",
        "aurora-3": "aurora3 30s ease-in-out infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "brutify-spin": "brutify-spin 0.8s linear infinite",
      },
      keyframes: {
        "brutify-spin": {
          to: { transform: "rotate(360deg)" },
        },
        aurora1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        aurora2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-30px, 20px) scale(1.1)" },
          "66%": { transform: "translate(20px, -30px) scale(0.9)" },
        },
        aurora3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1.05)" },
          "50%": { transform: "translate(25px, 15px) scale(0.95)" },
        },
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
