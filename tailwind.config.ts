import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        solar: {
          DEFAULT: "hsl(var(--solar))",
          foreground: "hsl(var(--solar-foreground))",
        },
        eco: {
          DEFAULT: "hsl(var(--eco))",
          foreground: "hsl(var(--eco-foreground))",
        },
        energy: {
          DEFAULT: "hsl(var(--energy))",
          foreground: "hsl(var(--energy-foreground))",
        },
        token: {
          DEFAULT: "hsl(var(--token))",
          foreground: "hsl(var(--token-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "bounce-once": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px 0px rgba(var(--glow-color), 0.4)" },
          "50%": { boxShadow: "0 0 40px 10px rgba(var(--glow-color), 0.6)" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(var(--glow-color), 0.5)" },
          "50%": { borderColor: "rgba(var(--glow-color), 0.9)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "text-glow": {
          "0%, 100%": { 
            textShadow: "0 0 8px hsl(142 76% 36% / 0.6), 0 0 16px hsl(142 76% 36% / 0.4), 0 0 24px hsl(142 76% 36% / 0.2)",
            filter: "brightness(1.05)"
          },
          "50%": { 
            textShadow: "0 0 12px hsl(142 76% 36% / 0.8), 0 0 24px hsl(142 76% 36% / 0.6), 0 0 36px hsl(142 76% 36% / 0.3)",
            filter: "brightness(1.2)"
          },
        },
        "icon-glow": {
          "0%, 100%": { 
            filter: "drop-shadow(0 0 4px hsl(142 76% 36% / 0.6)) drop-shadow(0 0 8px hsl(142 76% 36% / 0.4)) brightness(1.1)",
            transform: "scale(1)"
          },
          "50%": { 
            filter: "drop-shadow(0 0 12px hsl(142 76% 36% / 0.9)) drop-shadow(0 0 20px hsl(142 76% 36% / 0.6)) brightness(1.4)",
            transform: "scale(1.08)"
          },
        },
        "sidebar-glow": {
          "0%": { 
            boxShadow: "0 0 4px hsl(142 76% 36% / 0.3), inset 0 0 4px hsl(142 76% 36% / 0.1)",
            backgroundColor: "hsl(142 76% 36% / 0.05)"
          },
          "50%": { 
            boxShadow: "0 0 16px hsl(142 76% 36% / 0.5), inset 0 0 8px hsl(142 76% 36% / 0.2)",
            backgroundColor: "hsl(142 76% 36% / 0.12)"
          },
          "100%": { 
            boxShadow: "0 0 4px hsl(142 76% 36% / 0.3), inset 0 0 4px hsl(142 76% 36% / 0.1)",
            backgroundColor: "hsl(142 76% 36% / 0.05)"
          },
        },
        "logo-glow": {
          "0%, 100%": { 
            filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)) brightness(1.1)"
          },
          "50%": { 
            filter: "drop-shadow(0 0 16px rgba(16, 185, 129, 0.6)) brightness(1.15)"
          },
        },
        "breathing-glow": {
          "0%, 100%": { 
            boxShadow: "0 4px 24px -4px hsl(var(--primary) / 0.4), 0 0 32px hsl(var(--primary) / 0.25)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 8px 48px -2px hsl(var(--primary) / 0.6), 0 0 64px hsl(var(--primary) / 0.4)",
            transform: "scale(1.03)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "bounce-once": "bounce-once 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "shimmer": "shimmer 3s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "border-glow": "border-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "text-glow": "text-glow 2s ease-in-out infinite",
        "icon-glow": "icon-glow 1.5s ease-in-out infinite",
        "sidebar-glow": "sidebar-glow 2s ease-in-out infinite",
        "logo-glow": "logo-glow 3s ease-in-out infinite",
        "breathing-glow": "breathing-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
