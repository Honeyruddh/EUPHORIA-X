/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        campus: {
          dark: "#0b0f17",
          card: "#111827",
          cardBorder: "#1f2937",
          accent: "#10b981",
          accentHover: "#059669",
          water: "#06b6d4",
          waste: "#f59e0b",
          alert: "#ef4444"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
