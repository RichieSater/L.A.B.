UPDATE "user_app_meta"
SET "weekly_review" = CASE
  WHEN "weekly_review" ? 'entries' THEN "weekly_review"
  WHEN "weekly_review" ->> 'lastCompletedWeekStart' IS NOT NULL THEN jsonb_build_object(
    'entries',
    jsonb_build_array(
      jsonb_build_object(
        'weekStart',
        "weekly_review" ->> 'lastCompletedWeekStart',
        'completedAt',
        "weekly_review" -> 'completedAt',
        'biggestWin',
        '',
        'biggestLesson',
        '',
        'nextWeekNote',
        ''
      )
    )
  )
  ELSE '{"entries":[]}'::jsonb
END;--> statement-breakpoint
ALTER TABLE "user_app_meta" ALTER COLUMN "weekly_review" SET DEFAULT '{"entries":[]}'::jsonb;
