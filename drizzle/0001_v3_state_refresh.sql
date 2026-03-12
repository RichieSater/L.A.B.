CREATE TYPE "public"."calendar_sync_status" AS ENUM('disabled', 'pending', 'synced', 'failed');--> statement-breakpoint
ALTER TABLE "scheduled_sessions" ADD COLUMN "duration_minutes" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduled_sessions" ADD COLUMN "calendar_sync_status" "calendar_sync_status" DEFAULT 'disabled' NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduled_sessions" ADD COLUMN "google_calendar_event_id" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "google_calendar_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "google_calendar_email" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "google_calendar_refresh_token" text;--> statement-breakpoint
ALTER TABLE "user_app_meta" ALTER COLUMN "schema_version" SET DEFAULT 3;--> statement-breakpoint
