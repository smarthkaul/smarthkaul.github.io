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
      // Type scale: display (Syne 800, tight) → heading (Syne 700) → body (Inter)
      // → label (mono caps, wide). These name the two ends of the tracking range
      // and the label size so every eyebrow/badge/metadata line matches.
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        display: "-0.02em",
        eyebrow: "0.18em",
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
