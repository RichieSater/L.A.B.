CREATE TABLE "task_planning_assignments" (
	"user_id" text PRIMARY KEY NOT NULL,
	"assignments" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_planning_assignments" ADD CONSTRAINT "task_planning_assignments_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
