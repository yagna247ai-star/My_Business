// Pure unit tests only: no database, no global setup. Run with `npm run test:pure`.
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/gamify-builder.test.ts", "test/points.test.ts", "test/autoreview.test.ts", "test/standings.test.ts", "test/stuck-helper.test.ts", "test/ranks.test.ts", "test/journey-access-upload.test.ts", "test/settings-rules.test.ts", "test/dataset-check.test.ts", "test/da-domains.test.ts", "test/problem-tracks.test.ts", "test/level-flow.test.ts", "test/i18n.test.ts", "test/i18n-coverage.test.ts", "test/ai-models.test.ts", "test/answer-quality.test.ts", "test/level-view.test.ts", "test/generic-guided.test.ts", "test/proof-relevance.test.ts", "test/domain-guided-detail.test.ts", "test/showcase-moderation.test.ts", "test/areas.test.ts", "test/password-reset.test.ts", "test/auto-review-only.test.ts", "test/link-health.test.ts", "test/admin-control.test.ts", "test/points-rule.test.ts", "test/showcase-github.test.ts", "test/access-modules.test.ts", "test/analytics.test.ts", "test/day-materials.test.ts", "test/institutions.test.ts", "test/ranks-per-course.test.ts", "test/level-titles.test.ts", "test/journey-materials.test.ts", "test/day5-sql-tables.test.ts", "test/course-content-sql.test.ts", "test/learner-answers.test.ts", "test/level-ribbon.test.ts", "test/api-docs.test.ts", "test/profile-levels.test.ts", "test/profile-crown.test.ts", "test/this-week.test.ts", "test/cohort-week.test.ts", "test/feed-engagement.test.ts", "test/institution-sharing.test.ts", "test/registration-home.test.ts", "test/super-admin-everywhere.test.ts", "test/day-time.test.ts", "test/day-side-panel.test.ts"],
    testTimeout: 30000,
    server: { deps: { inline: ["next-auth", "@auth/core"] } },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./") } },
});
