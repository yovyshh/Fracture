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
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          glow: "var(--accent-glow)",
          hi: "var(--accent-hi)",
        },
        success: "var(--success)",
        danger: "var(--danger)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          mute: "var(--ink-mute)",
        },
      },
      borderRadius: {
        panel: "20px",
        "2.5xl": "20px",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 40px var(--accent-glow)",
        panel: "0 24px 60px rgba(0,0,0,0.4)",
        soft: "0 8px 28px rgba(0,0,0,0.28)",
      },
      backgroundImage: {
        ambient:
          "radial-gradient(ellipse 70% 50% at 50% -20%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)",
      },
      maxWidth: {
        workspace: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
