import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // MCB primary blue — used for buttons, blue section headers and active pills.
        brand: {
          50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
          400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
          800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
        },
        // MCB coral — the school name, the lightbulb halo, primary CTA accents.
        mcb: {
          50:  "#fff5f3",
          100: "#ffe6e1",
          200: "#ffc9bf",
          300: "#ffa192",
          400: "#ff7a64",
          500: "#f06548",
          orange: "#e55c3f",     // school name + primary brand accent
          red:    "#dc2626",     // active page-tab underline
          blue:   "#1e40af",     // section-header text
          lavender: "#ebe0ff",   // AY pill background
          lavenderInk: "#7c3aed",// AY pill text
        },
        // Pastel theme palette for class cards (mirrors GC illustrated banners)
        theme: {
          pink:     "#fde4ec",
          peach:    "#fde9c9",
          mint:     "#ddf3e4",
          sky:      "#dfeaff",
          lavender: "#ece1ff",
          rose:     "#fcd9d6",
          sand:     "#f4ead4",
          sage:     "#e2eedb",
        },
        themeDeep: {
          pink:     "#c4708e",
          peach:    "#c98a3b",
          mint:     "#3b8b5a",
          sky:      "#3b6fb4",
          lavender: "#7a5ec2",
          rose:     "#b15246",
          sand:     "#9a7a3a",
          sage:     "#5a7a3f",
        },
      },
      fontFamily: {
        sans: ['"Google Sans"', "ui-sans-serif", "system-ui", "Inter", "Roboto", "sans-serif"],
        display: ['"Google Sans"', "ui-sans-serif", "system-ui", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.05)",
        cardHover: "0 1px 3px rgba(60,64,67,.12), 0 4px 8px 3px rgba(60,64,67,.08)",
        fab: "0 3px 6px rgba(60,64,67,.15), 0 4px 12px rgba(60,64,67,.12)",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
