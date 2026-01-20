-- AlterTable
ALTER TABLE "workflow_step" ADD COLUMN     "case_step_id" UUID;

-- CreateIndex
CREATE INDEX "idx_workflow_step_case_step" ON "workflow_step"("case_step_id");

-- AddForeignKey
ALTER TABLE "workflow_step" ADD CONSTRAINT "workflow_step_case_step_id_fkey" FOREIGN KEY ("case_step_id") REFERENCES "case_step"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
