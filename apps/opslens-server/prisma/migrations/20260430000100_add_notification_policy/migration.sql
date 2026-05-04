-- Add per-user notification policy (server-side persisted settings)
ALTER TABLE "User"
ADD COLUMN "notificationPolicy" JSONB;
