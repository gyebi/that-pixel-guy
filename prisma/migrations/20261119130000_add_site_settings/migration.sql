-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'site',
    "businessName" VARCHAR(120) NOT NULL,
    "publicEmail" VARCHAR(254) NOT NULL,
    "phoneNumber" VARCHAR(32),
    "whatsAppNumber" VARCHAR(32),
    "location" VARCHAR(160),
    "instagramUrl" VARCHAR(2048),
    "facebookUrl" VARCHAR(2048),
    "pinterestUrl" VARCHAR(2048),
    "tikTokUrl" VARCHAR(2048),
    "youTubeUrl" VARCHAR(2048),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
