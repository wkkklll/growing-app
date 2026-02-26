import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        morandi: {
          blue: "#9BAEBC",
          green: "#B4C4B8",
          pink: "#D8B4B4",
          yellow: "#E2D1B3",
          gray: "#A9A9A9",
          beige: "#F5F5DC",
          sage: "#8A9A5B",
          dusty: "#967E76",
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
