-- Cached machine translations of lesson pages (one per page per language)
CREATE TABLE "content_translations" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "content_translations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "content_translations_contentId_locale_key" ON "content_translations"("contentId", "locale");
