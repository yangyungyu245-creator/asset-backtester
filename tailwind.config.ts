import type { Config } from "tailwindcss";
import { colors, radius, shadow } from "./lib/design/tokens";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "Pretendard",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "sans-serif",
        ],
      },
      colors: {
        ...colors,
        page: "var(--bg-page)",
        card: "var(--bg-card)",
        "card-subtle": "var(--bg-card-subtle)",
        border: "var(--border)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        surface: {
          dark: "#0a0a0a",
          card: "#1a1a1a",
        },
        positive: "#10b981",
        negative: "#ef4444",
        info: "#3b82f6",
      },
      borderRadius: radius,
      boxShadow: shadow,
    },
  },
  plugins: [],
};

export default config;
