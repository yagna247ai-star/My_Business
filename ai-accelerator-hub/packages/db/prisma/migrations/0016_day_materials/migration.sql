-- docs/DAY_MATERIALS_SPEC.md: day-wise study materials and each learner's opened / studied / practised ticks.
CREATE TABLE "day_materials" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'other',
    "note" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "linkStatus" TEXT NOT NULL DEFAULT 'unknown',
    "linkCheckedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "material_progress" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3),
    "studiedAt" TIMESTAMP(3),
    "practisedAt" TIMESTAMP(3),

    CONSTRAINT "material_progress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "day_materials_contentId_sortOrder_idx" ON "day_materials"("contentId", "sortOrder");

CREATE INDEX "day_materials_tenantId_idx" ON "day_materials"("tenantId");

CREATE INDEX "material_progress_userId_idx" ON "material_progress"("userId");

CREATE UNIQUE INDEX "material_progress_materialId_userId_key" ON "material_progress"("materialId", "userId");

ALTER TABLE "material_progress" ADD CONSTRAINT "material_progress_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "day_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

