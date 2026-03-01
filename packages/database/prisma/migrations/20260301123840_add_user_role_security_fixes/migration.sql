-- 🔒 CRITICAL SECURITY FIX: Add user role for admin authentication
-- AlterTable User: Add role field with default "USER"
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- Create index for role queries
CREATE INDEX "User_role_idx" ON "User"("role");

-- Optional: Create first admin user (comment out in production)
-- UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@example.com';
