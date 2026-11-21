// Pure unit tests only: no database, no global setup. Run with `npm run test:pure`.
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/gamify-builder.test.ts", "test/points.test.ts", "test/autoreview.test.ts", "test/standings.test.ts", "test/stuck-helper.test.ts", "test/ranks.test.ts", "test/journey-access-upload.test.ts", "test/settings-rules.test.ts", "test/dataset-check.test.ts", "test/da-domains.test.ts", "test/problem-tracks.test.ts", "test/level-flow.test.ts", "test/i18n.test.ts", "test/i18n-coverage.test.ts", "test/ai-models.test.ts"],
    testTimeout: 30000,
    server: { deps: { inline: ["next-auth", "@auth/core"] } },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./") } },
});
