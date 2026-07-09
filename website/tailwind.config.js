/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        grass: {
          light: "#3aa65c",
          DEFAULT: "#2f8f4e",
          dark: "#276e3c",
        },
        wimbledon: {
          light: "#6b4a8a",
          DEFAULT: "#4c2c69",
          dark: "#3a2151",
        },
        cream: "#f4f1e9",
        charcoal: "#181b18",
        ball: "#d6f84c",
      },
    },
  },
  plugins: [],
};
