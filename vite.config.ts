import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Coinbase Smart Wallet popup (keys.coinbase.com) needs window.opener
    // access. Default COOP `same-origin` blocks it ("This app doesn't support
    // smart wallets"). `same-origin-allow-popups` keeps isolation but allows
    // the popup to talk back.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
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
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // React itself and tiny shared utils (clsx, tailwind-merge, cva)
          // MUST live in their own chunks. If they get absorbed into the
          // charts/motion chunks, the entry bundle pulls ~430KB of Recharts
          // and 130KB of Framer Motion onto every public marketing page.
          if (/node_modules\/(react|react-dom|scheduler|react-is|use-sync-external-store)\//.test(id))
            return "react-vendor";
          if (/node_modules\/(clsx|tailwind-merge|class-variance-authority)\//.test(id))
            return "utils";

          if (id.includes("node_modules/recharts/")) return "charts";
          if (id.includes("node_modules/framer-motion/")) return "motion";
          if (/node_modules\/@radix-ui\/react-(dialog|dropdown-menu|tabs|tooltip|popover|select)\//.test(id))
            return "radix";
          // Let the lazy-loaded Web3 stack stay naturally grouped.
          // Splitting AppKit and wagmi manually creates circular chunk graphs.
          return;
        },

      },
    },
    // Increase chunk size warning limit (AppKit is large)
    chunkSizeWarningLimit: 2000,
    // Speed up builds by skipping source maps in production
    sourcemap: false,
    // Use esbuild for faster minification (terser is slower)
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
  },
  // Optimize asset handling - exclude large files from processing
  assetsInclude: [],
}));
