-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "shootId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Visible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Photo_shootId_idx" ON "Photo"("shootId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_shootId_fkey" FOREIGN KEY ("shootId") REFERENCES "Shoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
