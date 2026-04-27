import type { Config } from "tailwindcss";

// Tailwind theme is a thin mapping layer over the CSS variables in
// app/_tokens.css. Adding a colour or radius? Update the token first.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─── Brand: indigo-blue (refined) ───
        brand: {
          50:  "var(--color-brand-50)",
          100: "var(--color-brand-100)",
          200: "var(--color-brand-200)",
          300: "var(--color-brand-300)",
          400: "var(--color-brand-400)",
          500: "var(--color-brand-500)",
          600: "var(--color-brand-600)",
          700: "var(--color-brand-700)",
          800: "var(--color-brand-800)",
          900: "var(--color-brand-900)",
          950: "#1b2a6c",
        },

        // ─── Accent: warm coral, sparing usage ───
        accent: {
          50:  "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
        },

        // ─── Backwards-compat: legacy `mcb-*` aliases.
        // Kept so existing pages keep working during incremental migration.
        // New code should use `brand-*` and `accent-*`.
        mcb: {
          50:  "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-100)",
          300: "var(--color-accent-500)",
          400: "var(--color-accent-500)",
          500: "var(--color-accent-500)",
          orange:      "var(--color-accent-600)",
          red:         "var(--color-brand-700)",   // was MCB red — now brand-blue per design call
          blue:        "var(--color-brand-700)",
          lavender:    "var(--color-brand-50)",
          lavenderInk: "var(--color-brand-700)",
        },

        // ─── Pastel theme colours for class cards (kept) ───
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
        sans:    ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },

      borderRadius: {
        xs:    "var(--radius-xs)",
        sm:    "var(--radius-sm)",
        md:    "var(--radius-md)",
        lg:    "var(--radius-lg)",
        xl:    "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "2.5xl": "1.25rem",
      },

      boxShadow: {
        xs:        "var(--shadow-xs)",
        sm:        "var(--shadow-sm)",
        md:        "var(--shadow-md)",
        lg:        "var(--shadow-lg)",
        xl:        "var(--shadow-xl)",
        focus:     "var(--shadow-focus)",
        // Backwards-compat with the old `shadow-card` etc.
        card:      "var(--shadow-sm)",
        cardHover: "var(--shadow-md)",
        fab:       "var(--shadow-lg)",
      },

      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
