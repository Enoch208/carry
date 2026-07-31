import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The app imports through the `@/*` alias, so tests have to resolve it too —
// otherwise any module that reaches a `@/`-importing file fails to load.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
