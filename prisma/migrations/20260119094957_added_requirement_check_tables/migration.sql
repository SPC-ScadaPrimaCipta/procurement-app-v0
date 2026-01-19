-- CreateEnum
CREATE TYPE "requirement_check_mode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "requirement_check_status" AS ENUM ('PENDING', 'PASS', 'FAIL');

-- CreateTable
CREATE TABLE "step_requirement" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "step_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "doc_type_id" UUID,
    "check_mode" "requirement_check_mode" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "rule_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "step_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_requirement_check" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,
    "status" "requirement_check_status" NOT NULL DEFAULT 'PENDING',
    "checked_by" TEXT,
    "checked_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "evidence_document_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "case_requirement_check_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_step_req_step_active_sort" ON "step_requirement"("step_id", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "idx_step_req_doc_type" ON "step_requirement"("doc_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_step_req_step_name" ON "step_requirement"("step_id", "name");

-- CreateIndex
CREATE INDEX "idx_case_req_check_case" ON "case_requirement_check"("case_id");

-- CreateIndex
CREATE INDEX "idx_case_req_check_requirement" ON "case_requirement_check"("requirement_id");

-- CreateIndex
CREATE INDEX "idx_case_req_check_evidence_doc" ON "case_requirement_check"("evidence_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_case_req_check_case_req" ON "case_requirement_check"("case_id", "requirement_id");

-- AddForeignKey
ALTER TABLE "step_requirement" ADD CONSTRAINT "step_requirement_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "case_step"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "step_requirement" ADD CONSTRAINT "step_requirement_doc_type_id_fkey" FOREIGN KEY ("doc_type_id") REFERENCES "master_doc_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "case_requirement_check" ADD CONSTRAINT "case_requirement_check_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "procurement_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "case_requirement_check" ADD CONSTRAINT "case_requirement_check_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "step_requirement"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "case_requirement_check" ADD CONSTRAINT "case_requirement_check_evidence_document_id_fkey" FOREIGN KEY ("evidence_document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
