-- CreateEnum
CREATE TYPE "notification_recipient_type" AS ENUM ('USER', 'ROLE');

-- CreateEnum
CREATE TYPE "notification_severity" AS ENUM ('INFO', 'WARNING', 'ACTION_REQUIRED');

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recipient_type" "notification_recipient_type" NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT,
    "severity" "notification_severity" NOT NULL DEFAULT 'INFO',
    "ref_type" VARCHAR(100),
    "ref_id" UUID,
    "action_url" TEXT,
    "dedupe_key" VARCHAR(255),
    "created_by" TEXT NOT NULL DEFAULT 'SYSTEM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_dedupe_key_key" ON "notification"("dedupe_key");

-- CreateIndex
CREATE INDEX "idx_notif_recipient_read_created" ON "notification"("recipient_type", "recipient_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_notif_ref" ON "notification"("ref_type", "ref_id");

-- CreateIndex
CREATE INDEX "idx_notif_created_at" ON "notification"("created_at");
