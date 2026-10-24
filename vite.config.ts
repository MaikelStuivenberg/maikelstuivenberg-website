import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";
import { legacyCssCompatPlugin } from "./vite-plugin-legacy-css";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ["chrome >= 61", "android >= 61", "safari >= 12"],
      modernPolyfills: true,
      renderLegacyChunks: true,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
    legacyCssCompatPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssTarget: "chrome61",
  },
});
