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
          ink: "#102033",
          teal: "#0e7490",
          sand: "#f4efe7",
          gold: "#d97706",
          mist: "#e6edf4",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(16, 32, 51, 0.12)",
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(14, 116, 144, 0.22), transparent 32%), radial-gradient(circle at 80% 10%, rgba(217, 119, 6, 0.18), transparent 28%), linear-gradient(180deg, #f7f2ea 0%, #edf4f8 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
