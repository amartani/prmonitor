import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative paths so the built extension loads assets next to index.html in chrome-extension://.
  base: "./",
  plugins: [react()],
  build: {
    emptyOutDir: false,
    outDir: "dist",
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
  server: {
    port: 9000,
    open: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.spec.ts"],
  },
});
