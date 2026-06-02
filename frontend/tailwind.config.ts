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
          ink: "#17364c",
          teal: "#3d9ad6",
          sand: "#eef8ff",
          gold: "#79c8f2",
          mist: "#cfe8f8",
        },
      },
      boxShadow: {
        panel: "0 28px 70px rgba(53, 108, 145, 0.16)",
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(255, 255, 255, 0.98), transparent 28%), radial-gradient(circle at 100% 0%, rgba(121, 200, 242, 0.26), transparent 22%), radial-gradient(circle at 10% 90%, rgba(198, 236, 255, 0.34), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(238,248,255,0.98) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
