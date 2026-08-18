/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#0EA5A5",
          dark: "#0B7A7A",
        },
        bg: "#F2F8FB",
        ink: {
          DEFAULT: "#2B2B2B",
          soft: "#5B6B72",
        },
        success: "#1FAE6B",
        warning: "#E0A400",
        danger: "#E5484D",
      },
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(11, 122, 122, 0.08), 0 1px 2px rgba(11, 122, 122, 0.06)",
      },
    },
  },
  plugins: [],
};