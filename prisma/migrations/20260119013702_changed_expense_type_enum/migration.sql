/*
  Warnings:

  - The values [BELANJA_JASA] on the enum `ExpenseType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseType_new" AS ENUM ('BELANJA_BARANG', 'BELANJA_MODAL');
ALTER TABLE "contract" ALTER COLUMN "expense_type" TYPE "ExpenseType_new" USING ("expense_type"::text::"ExpenseType_new");
ALTER TYPE "ExpenseType" RENAME TO "ExpenseType_old";
ALTER TYPE "ExpenseType_new" RENAME TO "ExpenseType";
DROP TYPE "public"."ExpenseType_old";
COMMIT;
