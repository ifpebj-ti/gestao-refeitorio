import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "coverage"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: [
        "middleware.ts",
        "lib/**/*.ts",
        "app/utils/**/*.ts",
        "app/components/**/*.tsx",
        "app/context/**/*.tsx",
        "app/page.tsx",
        "app/**/usuarios/page.tsx",
      ],
      exclude: [
        "**/*.d.ts",
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
      },
    },
  },
});
