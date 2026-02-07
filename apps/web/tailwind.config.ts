import type { Config } from "tailwindcss";
import { tailwindPresetV1 } from "@repo/config";

const config: Config = {
  presets: [tailwindPresetV1],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};

export default config;
