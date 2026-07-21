/** @format */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/health": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    css: false,
    // Only pick up tests inside the frontend src folder
    include: ["src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    env: {
      VITE_GATEWAY_URL: "http://localhost:8080",
    },
  },
});
