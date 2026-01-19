-- AlterTable
ALTER TABLE "document" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
