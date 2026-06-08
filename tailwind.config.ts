import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0D1B4B",
        indigo: {
          DEFAULT: "#6366F1",
          dark: "#4F46E5",
        },
        success: "#22C55E",
        canvas: "#F0F2FA",
        cardborder: "#E8EAEF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        cardhover: "0 6px 24px rgba(13,27,75,0.10)",
        cardhoverlg: "0 8px 32px rgba(13,27,75,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
