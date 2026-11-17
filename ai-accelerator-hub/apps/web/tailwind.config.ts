import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // These names are defined by our own design system (app/styles): .gap-16 = 16px, .ring = progress ring.
  // Tailwind's versions (gap-16 = 4rem, ring = focus box-shadow) load later and silently override them.
  blocklist: ["gap-8", "gap-12", "gap-16", "gap-20", "gap-24", "ring"],
  theme: {
    extend: {
      // Theme colours live in app/styles/core.css as CSS variables (light/dark). Only fixed brand colours here.
      colors: {
        navy: "#101426",
        electric: "#3878F6",
        purple: "#8658E8",
        gold: "#E8B94F",
      },
      borderRadius: { lg: "1rem", md: "calc(1rem - 2px)", sm: "calc(1rem - 4px)" },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
