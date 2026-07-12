/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'psdb-blue': '#004488',
        'psdb-yellow': '#FFD700',
        'cidadania-pink': '#E6007E',
        'bg-main': '#F4F7F9',
        'ink-primary': '#1A1A1B',
        'line': '#D1D5DB',
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
}
