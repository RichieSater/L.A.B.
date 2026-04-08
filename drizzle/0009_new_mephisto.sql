CREATE TYPE "public"."account_tier" AS ENUM('free', 'premium', 'admin');--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "primary_email" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "account_tier" "account_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
UPDATE "user_profiles" SET "account_tier" = 'premium';
