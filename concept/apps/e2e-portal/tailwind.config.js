/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Open Sans"', "sans-serif"],
        sans: ['"Open Sans"', "sans-serif"],
      },
      colors: {
        portal: {
          bg: "#F8F4F1",
          card: "#ffffff",
          border: "#e0dbd7",
          accent: "#c96442",
          heading: "#4A1259",
          pass: "#22c55e",
          fail: "#ef4444",
          skip: "#eab308",
          text: "#3a3a3a",
          muted: "#5e5d59",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
