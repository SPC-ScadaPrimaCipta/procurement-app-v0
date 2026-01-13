-- CreateTable
CREATE TABLE "reimbursement_file" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reimbursement_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(150),
    "file_size" BIGINT,
    "file_url" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reimbursement_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reimbursement_file_reimbursement_id_idx" ON "reimbursement_file"("reimbursement_id");

-- AddForeignKey
ALTER TABLE "reimbursement_file" ADD CONSTRAINT "reimbursement_file_reimbursement_id_fkey" FOREIGN KEY ("reimbursement_id") REFERENCES "reimbursement"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
