-- CreateEnum
CREATE TYPE "RegulationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "reimbursement" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reimbursement_no" VARCHAR(100),
    "no_validasi_ppk" VARCHAR(150) NOT NULL,
    "tgl_validasi_ppk" DATE NOT NULL,
    "vendor_id" UUID,
    "nomor_kwitansi" VARCHAR(150) NOT NULL,
    "tanggal_kwitansi" DATE NOT NULL,
    "uraian_pekerjaan" TEXT NOT NULL,
    "nilai_kwitansi" DECIMAL(20,2) NOT NULL,
    "status_id" UUID NOT NULL,
    "keterangan" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "reimbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursement_status" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reimbursement_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_document" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type_id" UUID NOT NULL,
    "doc_number" VARCHAR(150) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "org_unit_id" UUID,
    "year" INTEGER,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "regulation_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_file" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "regulation_document_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(150),
    "file_size" BIGINT,
    "sp_site_id" VARCHAR(255),
    "sp_drive_id" VARCHAR(255),
    "sp_item_id" VARCHAR(255),
    "sp_web_url" TEXT,
    "folder_path" TEXT,
    "file_url" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_type" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reimbursement_status_id_idx" ON "reimbursement"("status_id");

-- CreateIndex
CREATE INDEX "reimbursement_vendor_id_idx" ON "reimbursement"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "reimbursement_status_name_key" ON "reimbursement_status"("name");

-- CreateIndex
CREATE INDEX "regulation_document_type_id_idx" ON "regulation_document"("type_id");

-- CreateIndex
CREATE INDEX "regulation_document_org_unit_id_idx" ON "regulation_document"("org_unit_id");

-- CreateIndex
CREATE INDEX "regulation_document_doc_number_idx" ON "regulation_document"("doc_number");

-- CreateIndex
CREATE INDEX "regulation_document_title_idx" ON "regulation_document"("title");

-- CreateIndex
CREATE INDEX "regulation_file_regulation_document_id_idx" ON "regulation_file"("regulation_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_type_name_key" ON "regulation_type"("name");

-- AddForeignKey
ALTER TABLE "reimbursement" ADD CONSTRAINT "reimbursement_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "reimbursement_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reimbursement" ADD CONSTRAINT "reimbursement_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_document" ADD CONSTRAINT "regulation_document_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "regulation_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_document" ADD CONSTRAINT "regulation_document_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_file" ADD CONSTRAINT "regulation_file_regulation_document_id_fkey" FOREIGN KEY ("regulation_document_id") REFERENCES "regulation_document"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
