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
        navy: "#46549C",
        "lab-blue": "#248DAC",
        "lab-green": "#228D7B",
        "lab-violet": "#7C5CBF",
        "lab-orange": "#C0713A",
        "lab-sky": "#1E6B9A",
        ink: "#182033",
        sand: "#F6F4EE",
      },
      boxShadow: {
        soft: "0 12px 32px rgba(24, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
