-- CreateTable
CREATE TABLE "master_disposition_recipient" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "master_disposition_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_disposition_forward_to" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "case_disposition_summary_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "sort_order" INTEGER,

    CONSTRAINT "case_disposition_forward_to_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_disposition_recipient_name_key" ON "master_disposition_recipient"("name");

-- CreateIndex
CREATE INDEX "master_disposition_recipient_is_active_sort_order_idx" ON "master_disposition_recipient"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "idx_dispo_forward_recipient" ON "case_disposition_forward_to"("recipient_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_dispo_forward_unique" ON "case_disposition_forward_to"("case_disposition_summary_id", "recipient_id");

-- AddForeignKey
ALTER TABLE "case_disposition_forward_to" ADD CONSTRAINT "case_disposition_forward_to_case_disposition_summary_id_fkey" FOREIGN KEY ("case_disposition_summary_id") REFERENCES "case_disposition_summary"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "case_disposition_forward_to" ADD CONSTRAINT "case_disposition_forward_to_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "master_disposition_recipient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
