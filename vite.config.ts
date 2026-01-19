import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // IMPORTANT: We use a custom push Service Worker at /sw.js (public/sw.js).
      // The PWA plugin must NOT auto-register or overwrite that file, otherwise
      // iOS/Chrome may run a Workbox SW without a `push` handler -> Apple returns 201
      // but no notification ever appears.
      injectRegister: false,
      // Generate a separate SW file so it never collides with public/sw.js
      filename: "pwa-sw.js",
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
        "zs-icon-192.png",
        "zs-icon-512.png",
        "zs-icon-maskable-512.png",
      ],
      manifest: {
        name: "$ZSOLAR",
        short_name: "$ZSOLAR",
        description:
          "Earn blockchain rewards for sustainable energy actions. Track solar production, EV miles, and CO2 offsets.",
        theme_color: "#1e88e5",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/zs-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/zs-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/zs-icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevent duplicate React copies (fixes `dispatcher.useEffect` null errors)
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  build: {
    // Optimize chunking for faster builds
    rollupOptions: {
      output: {
        manualChunks: {
          // Split AppKit into its own chunk for better caching
          'appkit': ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
          'wagmi': ['wagmi', 'viem'],
        },
      },
    },
    // Increase chunk size warning limit (AppKit is large)
    chunkSizeWarningLimit: 2000,
  },
}));
