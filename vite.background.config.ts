import path from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

/** Single-file ES bundle for the MV3 service worker (no shared chunks). */
export default defineConfig(({ mode }) => {
  const nodeEnv = mode === "production" ? "production" : "development";
  return {
    // Library mode does not apply the same env defines as app builds; dependencies
    // (graphql, MobX, etc.) reference process.env.NODE_ENV and crash without this.
    define: {
      "process.env.NODE_ENV": JSON.stringify(nodeEnv),
    },
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
          // Bare `process` is still referenced by some deps (e.g. universal-user-agent
          // user-agent detection). MV3 workers have no Node global; a minimal shim avoids
          // ReferenceError regardless of minifier evaluation order.
          banner: `var process = { env: { NODE_ENV: ${JSON.stringify(nodeEnv)} }, version: void 0 };`,
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
  };
});
