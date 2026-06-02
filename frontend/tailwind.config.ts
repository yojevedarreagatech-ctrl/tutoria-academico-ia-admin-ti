import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#16303d",
          teal: "#1f6f78",
          sand: "#f6fbfc",
          gold: "#7c5cff",
          mist: "#d9e6ea",
        },
      },
      boxShadow: {
        panel: "0 28px 70px rgba(22, 48, 61, 0.12)",
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(255, 255, 255, 0.98), transparent 28%), radial-gradient(circle at 100% 0%, rgba(124, 92, 255, 0.14), transparent 22%), radial-gradient(circle at 10% 90%, rgba(31, 111, 120, 0.12), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,251,252,0.98) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
