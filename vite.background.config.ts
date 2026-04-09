import path from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

/** Single-file ES bundle for the MV3 service worker (no shared chunks). */
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
    lib: {
      entry: path.resolve(__dirname, "src/background.ts"),
      name: "background",
      formats: ["es"],
      fileName: () => "background",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "background.js",
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "." },
        { src: "images", dest: "." },
      ],
    }),
  ],
});
