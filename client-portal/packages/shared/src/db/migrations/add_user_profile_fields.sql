-- Migration: Add user profile fields (userType, employeeCount, updatedAt)
-- Run this migration to add profile fields to the users table

ALTER TABLE "taxgpt"."users" 
  ADD COLUMN IF NOT EXISTS "user_type" varchar(20),
  ADD COLUMN IF NOT EXISTS "employee_count" varchar(10),
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Update existing rows to set updated_at to created_at if it's null
UPDATE "taxgpt"."users" 
SET "updated_at" = "created_at" 
WHERE "updated_at" IS NULL;
