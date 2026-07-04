import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        masala: {
          red: "#B4182A",       // packet red
          redDeep: "#7A0F1C",
          gold: "#F2B90B",      // packet mustard/gold
          goldSoft: "#FBE29B",
          brown: "#3B1F14",     // powder brown
          cream: "#FDF6E3",     // label cream
          green: "#1F7A3F",     // FSSAI mark green, used sparingly
        },
      },
      backgroundImage: {
        "masala-gradient": "linear-gradient(135deg, #B4182A 0%, #7A0F1C 60%, #3B1F14 100%)",
        "gold-gradient": "linear-gradient(135deg, #F2B90B 0%, #FBE29B 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(242,185,11,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
