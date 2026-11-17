/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070A12",
        gold: "#C9A86A",
        "gold-soft": "#E8D5B5",
        panel: "#0F172A",
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
