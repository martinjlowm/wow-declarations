import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // fast-check shrinking can run many iterations; keep the suite snappy.
    testTimeout: 20_000,
  },
});
