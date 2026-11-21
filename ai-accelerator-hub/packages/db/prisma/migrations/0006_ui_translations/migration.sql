-- Machine translations of interface text, per language
CREATE TABLE "ui_translations" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ui_translations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ui_translations_locale_key_key" ON "ui_translations"("locale", "key");
