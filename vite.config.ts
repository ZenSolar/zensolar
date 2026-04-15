import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
        manualChunks: {
          // Let the lazy-loaded Web3 stack stay naturally grouped.
          // Splitting AppKit and wagmi manually creates circular chunk graphs.
          // Split UI framework
          'radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],
          // Split charting library
          'charts': ['recharts'],
          // Split animation library
          'motion': ['framer-motion'],
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
