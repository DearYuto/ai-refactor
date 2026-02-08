import type { Config } from "tailwindcss";

export const tailwindPresetV1 = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--color-brand-50)",
          100: "var(--color-brand-100)",
          300: "var(--color-brand-300)",
          500: "var(--color-brand-500)",
          700: "var(--color-brand-700)",
          900: "var(--color-brand-900)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          soft: "var(--color-border-soft)",
          strong: "var(--color-border-strong)",
        },
        text: {
          main: "var(--color-text-main)",
          sub: "var(--color-text-sub)",
        },
        bg: {
          main: "var(--color-bg-main)",
          sub: "var(--color-bg-sub)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export const tailwindPreset = tailwindPresetV1;
