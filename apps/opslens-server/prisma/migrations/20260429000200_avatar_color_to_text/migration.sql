ALTER TABLE "User"
ALTER COLUMN "avatarColor" TYPE TEXT
USING "avatarColor"::text;

UPDATE "User"
SET "avatarColor" = CASE "avatarColor"
  WHEN 'default' THEN '#64748B'
  WHEN 'primary' THEN '#3B82F6'
  WHEN 'success' THEN '#22C55E'
  WHEN 'warning' THEN '#F59E0B'
  WHEN 'danger' THEN '#EF4444'
  ELSE '#3B82F6'
END;

ALTER TABLE "User"
ALTER COLUMN "avatarColor" SET DEFAULT '#3B82F6';

DROP TYPE IF EXISTS "AvatarColor";
