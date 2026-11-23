-- Showcase moderation: hide / feature projects with a recorded reason, and member reports
ALTER TABLE "projects" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'visible';
ALTER TABLE "projects" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "moderatedById" TEXT;
ALTER TABLE "projects" ADD COLUMN "moderatedAt" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "moderationNote" TEXT;

CREATE TABLE "showcase_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    CONSTRAINT "showcase_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "showcase_reports_projectId_userId_key" ON "showcase_reports"("projectId", "userId");
CREATE INDEX "showcase_reports_tenantId_resolvedAt_idx" ON "showcase_reports"("tenantId", "resolvedAt");
ALTER TABLE "showcase_reports" ADD CONSTRAINT "showcase_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
