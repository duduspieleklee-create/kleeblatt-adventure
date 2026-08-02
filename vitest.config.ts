import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "apps/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.{test,spec}.{ts,mjs}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/**/src/**", "packages/**/src/**"],
    },
  },
});
