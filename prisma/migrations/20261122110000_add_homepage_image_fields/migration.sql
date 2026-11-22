-- Adds optional replacement images for existing homepage photograph positions.
-- Existing rows and public output retain the static image fallbacks until an
-- authenticated administrator saves a replacement.
ALTER TABLE "HomepageContent"
  ADD COLUMN "heroImageUrl" VARCHAR(2048),
  ADD COLUMN "heroImageAlt" VARCHAR(300),
  ADD COLUMN "workWeddingImageUrl" VARCHAR(2048),
  ADD COLUMN "workWeddingImageAlt" VARCHAR(300),
  ADD COLUMN "workPortraitImageUrl" VARCHAR(2048),
  ADD COLUMN "workPortraitImageAlt" VARCHAR(300),
  ADD COLUMN "workFamilyImageUrl" VARCHAR(2048),
  ADD COLUMN "workFamilyImageAlt" VARCHAR(300),
  ADD COLUMN "serviceImageUrl" VARCHAR(2048),
  ADD COLUMN "serviceImageAlt" VARCHAR(300),
  ADD COLUMN "contactImageUrl" VARCHAR(2048),
  ADD COLUMN "contactImageAlt" VARCHAR(300);
