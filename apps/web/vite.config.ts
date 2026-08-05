import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      phaser: resolve(__dirname, "../../node_modules/phaser/src/phaser.js"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/me": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
