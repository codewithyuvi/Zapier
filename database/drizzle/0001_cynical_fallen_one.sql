CREATE TABLE "zap_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"zap_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'processing' NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "actions" DROP CONSTRAINT "actions_zap_id_unique";--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "zap_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "action_order" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "trigger_outbox" ALTER COLUMN "zap_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "triggers" ALTER COLUMN "zap_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "zaps" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "zap_runs" ADD CONSTRAINT "zap_runs_zap_id_zaps_id_fk" FOREIGN KEY ("zap_id") REFERENCES "public"."zaps"("id") ON DELETE no action ON UPDATE no action;