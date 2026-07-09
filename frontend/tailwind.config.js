/**
 * @format
 * @type {import('tailwindcss').Config}
 */

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E14",
        surface: "#12161F",
        raised: "#171C27",
        border: "#232938",
        accent: "#F2B84B",
        "accent-dim": "#7A5F26",
        up: "#34D399",
        down: "#F2545B",
        info: "#5B8DEF",
        muted: "#8A93A6",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "SFMono-Regular", "Consolas", "monospace"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};
