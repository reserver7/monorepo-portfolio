CREATE TYPE "AvatarColor" AS ENUM ('default', 'primary', 'success', 'warning', 'danger');

ALTER TABLE "User"
ADD COLUMN "avatarColor" "AvatarColor" NOT NULL DEFAULT 'primary';
