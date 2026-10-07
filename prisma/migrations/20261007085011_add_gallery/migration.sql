-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "shootId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expiresOn" TIMESTAMP(3),
    "downloadsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gallery_shootId_idx" ON "Gallery"("shootId");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_shootId_fkey" FOREIGN KEY ("shootId") REFERENCES "Shoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
