ALTER TABLE "user_app_meta"
ADD COLUMN "strategic_dashboard" jsonb DEFAULT '{"years":[],"latestCompassInsights":null}'::jsonb NOT NULL;
