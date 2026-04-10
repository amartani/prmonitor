/**
 * Ensures dist/background.js does not contain bare Node `process` references.
 * Dependencies sometimes emit `process.env` or `process.*`; those must be
 * stripped or shimmed by the Vite background build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(__dirname, "..", "dist", "background.js");

let code;
try {
  code = fs.readFileSync(bundlePath, "utf8");
} catch (e) {
  console.error(
    "check-background-bundle: could not read dist/background.js (run vite background build first)",
  );
  process.exit(1);
}

if (code.includes("process.env")) {
  console.error(
    'check-background-bundle: dist/background.js must not contain the substring "process.env" (use Vite define / shim in vite.background.config.ts).',
  );
  process.exit(1);
}

// Property access `*.process` is allowed (e.g. detecting Node from `global.process`).
const bareProcess = /(?<!\.)process\b/g;
if (bareProcess.test(code)) {
  console.error(
    "check-background-bundle: dist/background.js contains a bare `process` identifier (not .process).",
  );
  process.exit(1);
}
