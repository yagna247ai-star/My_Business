import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["lib/__tests__/**/*.test.ts", "test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "", DATABASE_URL_UNPOOLED: process.env.TEST_DATABASE_URL ?? "", NEXTAUTH_SECRET: "test-secret-test-secret-test-secret-1234", RAZORPAY_WEBHOOK_SECRET: "whsec_test_only", ANTHROPIC_API_KEY: "", ANTHROPIC_AUTH_TOKEN: "" },
    fileParallelism: false,
    server: { deps: { inline: ["next-auth", "@auth/core"] } },
    testTimeout: 30000,
    hookTimeout: 120000,
    coverage: { reporter: ["text", "lcov"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./") } },
});
