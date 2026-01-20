/*
  Warnings:

  - Added the required column `createdById` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "createdById" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Quiz_createdById_idx" ON "Quiz"("createdById");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
