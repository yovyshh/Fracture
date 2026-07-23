import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#09090B",
        surface: "#111113",
        elevated: "#16161A",
        line: "rgba(255,255,255,0.06)",
        "line-strong": "rgba(255,255,255,0.10)",
        accent: {
          DEFAULT: "#7C3AED",
          soft: "rgba(124,58,237,0.15)",
          glow: "rgba(124,58,237,0.45)",
          hi: "#A78BFA",
        },
        success: "#22C55E",
        danger: "#EF4444",
        ink: {
          DEFAULT: "#FAFAFA",
          soft: "#A1A1AA",
          mute: "#71717A",
        },
      },
      borderRadius: {
        xl2: "18px",
        "2.5xl": "22px",
        "3xl": "24px",
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 40px rgba(124,58,237,0.25)",
        card: "0 20px 50px rgba(0,0,0,0.45)",
        soft: "0 8px 30px rgba(0,0,0,0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "hero-glow":
          "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(124,58,237,0.28), transparent 60%)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
