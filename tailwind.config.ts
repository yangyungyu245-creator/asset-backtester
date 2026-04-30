import type { Config } from "tailwindcss";

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
        surface: {
          dark: "#0a0a0a",
          card: "#1a1a1a",
        },
        positive: "#10b981",
        negative: "#ef4444",
        info: "#3b82f6",
      },
    },
  },
  plugins: [],
};

export default config;
