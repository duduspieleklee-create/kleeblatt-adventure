import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Absoluter Pfad: Vitest löst setupFiles relativ zum CWD des jeweiligen Workspace auf.
const apiTestSetup = fileURLToPath(new URL("./apps/api/src/test/setup.ts", import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx,mjs}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
    setupFiles: [apiTestSetup],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**"],
    },
  },
});
