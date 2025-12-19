-- AlterTable
ALTER TABLE "workflow" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "workflow_action_log" ALTER COLUMN "actor_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "workflow_instance" ALTER COLUMN "created_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "workflow_step_instance" ALTER COLUMN "acted_by" SET DATA TYPE TEXT;
