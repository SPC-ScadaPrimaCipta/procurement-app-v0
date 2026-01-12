-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('BELANJA_BARANG', 'BELANJA_JASA');

-- CreateEnum
CREATE TYPE "BastType" AS ENUM ('PHO', 'FHO', 'BAST');

-- CreateTable
CREATE TABLE "procurement_case" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_code" VARCHAR(100),
    "title" VARCHAR(255) NOT NULL,
    "unit_id" UUID,
    "agenda_scope" TEXT,
    "status_id" UUID NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "procurement_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence_in" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_id" UUID NOT NULL,
    "agenda_number" VARCHAR(100),
    "received_date" DATE NOT NULL,
    "disposition_date" DATE,
    "from_name" VARCHAR(255) NOT NULL,
    "letter_date" DATE NOT NULL,
    "letter_number" VARCHAR(150) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "cc" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correspondence_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence_out" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_id" UUID NOT NULL,
    "letter_number" VARCHAR(150) NOT NULL,
    "letter_date" DATE NOT NULL,
    "from_name" VARCHAR(255) NOT NULL,
    "to_name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correspondence_out_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_disposition_summary" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_id" UUID NOT NULL,
    "agenda_scope" TEXT,
    "agenda_number" VARCHAR(100),
    "disposition_date" DATE,
    "disposition_actions" TEXT,
    "disposition_note" TEXT,
    "forward_kabag" VARCHAR(255),
    "forward_to_user_id" TEXT,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "case_disposition_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_id" UUID NOT NULL,
    "contract_number" VARCHAR(150) NOT NULL,
    "contract_date" DATE NOT NULL,
    "vendor_id" UUID,
    "work_description" TEXT NOT NULL,
    "contract_value" DECIMAL(20,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "duration_days" INTEGER,
    "procurement_method_id" UUID NOT NULL,
    "contract_status_id" UUID NOT NULL,
    "expense_type" "ExpenseType" NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_payment_plan" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contract_id" UUID NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "line_no" INTEGER NOT NULL,
    "line_amount" DECIMAL(20,2) NOT NULL,
    "planned_date" DATE,
    "notes" TEXT,

    CONSTRAINT "contract_payment_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedule" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contract_id" UUID NOT NULL,
    "payment_plan_id" UUID,
    "payment_no" INTEGER NOT NULL,
    "description" TEXT,
    "planned_payment_date" DATE,
    "actual_payment_date" DATE,
    "planned_amount" DECIMAL(20,2),
    "actual_amount" DECIMAL(20,2),
    "payment_status" VARCHAR(20) NOT NULL,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bast" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contract_id" UUID NOT NULL,
    "payment_plan_id" UUID,
    "bast_type" "BastType" NOT NULL,
    "bast_number" VARCHAR(150),
    "bast_date" DATE NOT NULL,
    "progress_percent" DECIMAL(5,2),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_doc_type" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_doc_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_step" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_id" UUID NOT NULL,
    "doc_type_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "doc_number" VARCHAR(150),
    "doc_date" DATE,
    "step_id" UUID,
    "version_no" INTEGER NOT NULL,
    "is_latest" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_file" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "document_id" UUID NOT NULL,
    "sp_site_id" VARCHAR(255),
    "sp_drive_id" VARCHAR(255),
    "sp_item_id" VARCHAR(255),
    "sp_web_url" TEXT,
    "folder_path" TEXT,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(150),
    "file_size" BIGINT,
    "file_url" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "document_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_unit" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "unit_type" VARCHAR(50) NOT NULL,
    "unit_code" VARCHAR(50),
    "unit_name" VARCHAR(255) NOT NULL,
    "parent_unit_id" UUID,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "org_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_status" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_disposition_action" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_disposition_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_procurement_method" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_procurement_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_contract_status" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_contract_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_supplier_type" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_supplier_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vendor_name" VARCHAR(255) NOT NULL,
    "supplier_type_id" UUID NOT NULL,
    "npwp" VARCHAR(50),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bank_account" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vendor_id" UUID NOT NULL,
    "account_number" VARCHAR(100) NOT NULL,
    "account_name" VARCHAR(255),
    "bank_name" VARCHAR(255),
    "branch_name" VARCHAR(255),
    "currency_code" VARCHAR(10),
    "is_primary" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "vendor_bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_business_license" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vendor_id" UUID NOT NULL,
    "license_type" VARCHAR(100) NOT NULL,
    "license_number" VARCHAR(150) NOT NULL,
    "qualification" VARCHAR(50) NOT NULL,
    "issued_date" DATE,
    "expiry_date" DATE,
    "issuer" VARCHAR(255),
    "notes" TEXT,
    "status" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "vendor_business_license_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_management" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vendor_id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "position_title" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "vendor_management_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procurement_case_case_code_key" ON "procurement_case"("case_code");

-- CreateIndex
CREATE UNIQUE INDEX "correspondence_in_case_id_key" ON "correspondence_in"("case_id");

-- CreateIndex
CREATE INDEX "correspondence_out_case_id_idx" ON "correspondence_out"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_disposition_summary_case_id_key" ON "case_disposition_summary"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_case_id_key" ON "contract"("case_id");

-- CreateIndex
CREATE INDEX "contract_payment_plan_contract_id_idx" ON "contract_payment_plan"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_contract_payment_plan_contract_line" ON "contract_payment_plan"("contract_id", "line_no");

-- CreateIndex
CREATE INDEX "payment_schedule_contract_id_idx" ON "payment_schedule"("contract_id");

-- CreateIndex
CREATE INDEX "payment_schedule_payment_plan_id_idx" ON "payment_schedule"("payment_plan_id");

-- CreateIndex
CREATE INDEX "bast_contract_id_idx" ON "bast"("contract_id");

-- CreateIndex
CREATE INDEX "bast_payment_plan_id_idx" ON "bast"("payment_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_doc_type_name_key" ON "master_doc_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "case_step_name_key" ON "case_step"("name");

-- CreateIndex
CREATE INDEX "document_case_id_idx" ON "document"("case_id");

-- CreateIndex
CREATE INDEX "document_doc_type_id_idx" ON "document"("doc_type_id");

-- CreateIndex
CREATE INDEX "document_step_id_idx" ON "document"("step_id");

-- CreateIndex
CREATE INDEX "document_file_document_id_idx" ON "document_file"("document_id");

-- CreateIndex
CREATE INDEX "org_unit_parent_unit_id_idx" ON "org_unit"("parent_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_status_name_key" ON "case_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "master_disposition_action_name_key" ON "master_disposition_action"("name");

-- CreateIndex
CREATE UNIQUE INDEX "master_procurement_method_name_key" ON "master_procurement_method"("name");

-- CreateIndex
CREATE UNIQUE INDEX "master_contract_status_name_key" ON "master_contract_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "master_supplier_type_name_key" ON "master_supplier_type"("name");

-- CreateIndex
CREATE INDEX "vendor_supplier_type_id_idx" ON "vendor"("supplier_type_id");

-- CreateIndex
CREATE INDEX "vendor_bank_account_vendor_id_idx" ON "vendor_bank_account"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vendor_bank_account_vendor_accno" ON "vendor_bank_account"("vendor_id", "account_number");

-- CreateIndex
CREATE INDEX "vendor_business_license_vendor_id_idx" ON "vendor_business_license"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_management_vendor_id_idx" ON "vendor_management"("vendor_id");

-- AddForeignKey
ALTER TABLE "procurement_case" ADD CONSTRAINT "procurement_case_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "org_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "procurement_case" ADD CONSTRAINT "procurement_case_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "case_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "correspondence_in" ADD CONSTRAINT "correspondence_in_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "procurement_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "correspondence_out" ADD CONSTRAINT "correspondence_out_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "procurement_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "case_disposition_summary" ADD CONSTRAINT "case_disposition_summary_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "procurement_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "procurement_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_procurement_method_id_fkey" FOREIGN KEY ("procurement_method_id") REFERENCES "master_procurement_method"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_contract_status_id_fkey" FOREIGN KEY ("contract_status_id") REFERENCES "master_contract_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract_payment_plan" ADD CONSTRAINT "contract_payment_plan_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_schedule" ADD CONSTRAINT "payment_schedule_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_schedule" ADD CONSTRAINT "payment_schedule_payment_plan_id_fkey" FOREIGN KEY ("payment_plan_id") REFERENCES "contract_payment_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bast" ADD CONSTRAINT "bast_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bast" ADD CONSTRAINT "bast_payment_plan_id_fkey" FOREIGN KEY ("payment_plan_id") REFERENCES "contract_payment_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "procurement_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_doc_type_id_fkey" FOREIGN KEY ("doc_type_id") REFERENCES "master_doc_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "case_step"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_file" ADD CONSTRAINT "document_file_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_unit" ADD CONSTRAINT "org_unit_parent_unit_id_fkey" FOREIGN KEY ("parent_unit_id") REFERENCES "org_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_supplier_type_id_fkey" FOREIGN KEY ("supplier_type_id") REFERENCES "master_supplier_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vendor_bank_account" ADD CONSTRAINT "vendor_bank_account_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vendor_business_license" ADD CONSTRAINT "vendor_business_license_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vendor_management" ADD CONSTRAINT "vendor_management_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
