/*
  Warnings:

  - You are about to drop the column `procurement_type_id` on the `procurement_case` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "procurement_case" DROP CONSTRAINT "procurement_case_procurement_type_id_fkey";

-- AlterTable
ALTER TABLE "contract" ADD COLUMN     "procurement_type_id" UUID;

-- AlterTable
ALTER TABLE "procurement_case" DROP COLUMN "procurement_type_id";

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_procurement_type_id_fkey" FOREIGN KEY ("procurement_type_id") REFERENCES "master_procurement_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
