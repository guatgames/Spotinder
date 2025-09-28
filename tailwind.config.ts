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
        // Music app specific colors
        music: {
          "bg-primary": "hsl(var(--music-bg-primary))",
          "bg-secondary": "hsl(var(--music-bg-secondary))",
          "bg-card": "hsl(var(--music-bg-card))",
          accent: "hsl(var(--music-accent))",
          "accent-hover": "hsl(var(--music-accent-hover))",
          "text-primary": "hsl(var(--music-text-primary))",
          "text-secondary": "hsl(var(--music-text-secondary))",
          "text-muted": "hsl(var(--music-text-muted))",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
        "gradient-bg": "var(--gradient-bg)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        button: "var(--shadow-button)",
        glow: "var(--shadow-glow)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "swipe-right": {
          "0%": {
            transform: "translateX(0) rotate(0deg)",
            opacity: "1"
          },
          "100%": {
            transform: "translateX(100vw) rotate(15deg)",
            opacity: "0"
          }
        },
        "swipe-left": {
          "0%": {
            transform: "translateX(0) rotate(0deg)",
            opacity: "1"
          },
          "100%": {
            transform: "translateX(-100vw) rotate(-15deg)",
            opacity: "0"
          }
        },
        "card-enter": {
          "0%": {
            transform: "scale(0.8) translateY(20px)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1) translateY(0)",
            opacity: "1"
          }
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "var(--shadow-card)"
          },
          "50%": {
            boxShadow: "var(--shadow-glow)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "swipe-right": "swipe-right 0.5s ease-out forwards",
        "swipe-left": "swipe-left 0.5s ease-out forwards",
        "card-enter": "card-enter 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
