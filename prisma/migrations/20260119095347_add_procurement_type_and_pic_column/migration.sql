-- AlterTable
ALTER TABLE "procurement_case" ADD COLUMN     "pic" VARCHAR(255),
ADD COLUMN     "procurement_type_id" UUID;

-- CreateTable
CREATE TABLE "master_procurement_type" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_procurement_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_procurement_type_name_key" ON "master_procurement_type"("name");

-- AddForeignKey
ALTER TABLE "procurement_case" ADD CONSTRAINT "procurement_case_procurement_type_id_fkey" FOREIGN KEY ("procurement_type_id") REFERENCES "master_procurement_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
