CREATE TYPE "AuthProvider" AS ENUM ('local', 'google', 'github');

ALTER TABLE "User"
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'local';
