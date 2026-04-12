ALTER TABLE "compass_sessions" ADD COLUMN "achieved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_app_meta" ALTER COLUMN "strategic_dashboard" SET DEFAULT '{"years":[],"activeCompassSessionId":null,"latestCompassInsights":null,"latestCompassAdvisorContext":null,"achievedCompassSummaries":[]}'::jsonb;
