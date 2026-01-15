/*
  Warnings:

  - You are about to drop the column `case_id` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `document` table. All the data in the column will be lost.
  - You are about to drop the `document_file` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ref_id` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ref_type` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaded_by` to the `document` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_case_id_fkey";

-- DropForeignKey
ALTER TABLE "document_file" DROP CONSTRAINT "document_file_document_id_fkey";

-- DropIndex
DROP INDEX "document_case_id_idx";

-- AlterTable
ALTER TABLE "document" DROP COLUMN "case_id",
DROP COLUMN "created_by",
ADD COLUMN     "file_name" VARCHAR(255),
ADD COLUMN     "file_size" BIGINT,
ADD COLUMN     "file_url" TEXT,
ADD COLUMN     "folder_path" TEXT,
ADD COLUMN     "mime_type" VARCHAR(150),
ADD COLUMN     "ref_id" UUID NOT NULL,
ADD COLUMN     "ref_type" VARCHAR(100) NOT NULL,
ADD COLUMN     "sp_drive_id" VARCHAR(255),
ADD COLUMN     "sp_item_id" VARCHAR(255),
ADD COLUMN     "sp_site_id" VARCHAR(255),
ADD COLUMN     "sp_web_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6),
ADD COLUMN     "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploaded_by" TEXT NOT NULL;

-- DropTable
DROP TABLE "document_file";
