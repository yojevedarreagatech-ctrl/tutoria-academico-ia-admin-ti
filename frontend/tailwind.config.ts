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
          ink: "#4a2434",
          teal: "#c04c79",
          sand: "#fff4f8",
          gold: "#f08bb2",
          mist: "#f3c9d8",
        },
      },
      boxShadow: {
        panel: "0 28px 70px rgba(145, 67, 97, 0.16)",
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(255, 255, 255, 0.98), transparent 28%), radial-gradient(circle at 100% 0%, rgba(240, 139, 178, 0.24), transparent 22%), radial-gradient(circle at 10% 90%, rgba(255, 210, 228, 0.3), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,244,248,0.98) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
