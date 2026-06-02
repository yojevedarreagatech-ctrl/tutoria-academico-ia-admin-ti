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
          ink: "#111827",
          teal: "#111111",
          sand: "#f8fafc",
          gold: "#374151",
          mist: "#e5e7eb",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(255, 255, 255, 0.96), transparent 28%), radial-gradient(circle at 92% 2%, rgba(226, 232, 240, 0.7), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(244,247,250,0.96) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
