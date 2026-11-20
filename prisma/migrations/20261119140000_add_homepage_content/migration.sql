-- CreateTable
CREATE TABLE "HomepageContent" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'homepage',
    "heroEyebrow" VARCHAR(120) NOT NULL,
    "heroHeading" VARCHAR(180) NOT NULL,
    "heroIntro" VARCHAR(600) NOT NULL,
    "heroCtaLabel" VARCHAR(80) NOT NULL,
    "introEyebrow" VARCHAR(120) NOT NULL,
    "introHeading" VARCHAR(180) NOT NULL,
    "introBody" VARCHAR(800) NOT NULL,
    "introCtaLabel" VARCHAR(80) NOT NULL,
    "workEyebrow" VARCHAR(120) NOT NULL,
    "workHeading" VARCHAR(180) NOT NULL,
    "workCtaLabel" VARCHAR(80) NOT NULL,
    "servicesEyebrow" VARCHAR(120) NOT NULL,
    "servicesHeading" VARCHAR(180) NOT NULL,
    "servicesBody" VARCHAR(800) NOT NULL,
    "contactEyebrow" VARCHAR(120) NOT NULL,
    "contactHeading" VARCHAR(180) NOT NULL,
    "contactCtaLabel" VARCHAR(80) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageContent_pkey" PRIMARY KEY ("id")
);
