CREATE TABLE "actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"zap_id" serial NOT NULL,
	"available_action_id" varchar(256) NOT NULL,
	"action_order" serial NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "actions_zap_id_unique" UNIQUE("zap_id")
);
--> statement-breakpoint
CREATE TABLE "available_actions" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "available_triggers" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trigger_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"zap_id" serial NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"zap_id" serial NOT NULL,
	"available_trigger_id" varchar(256) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "triggers_zap_id_unique" UNIQUE("zap_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"title" varchar(256) NOT NULL,
	"is_active" varchar DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_zap_id_zaps_id_fk" FOREIGN KEY ("zap_id") REFERENCES "public"."zaps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_available_action_id_available_actions_id_fk" FOREIGN KEY ("available_action_id") REFERENCES "public"."available_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trigger_outbox" ADD CONSTRAINT "trigger_outbox_zap_id_zaps_id_fk" FOREIGN KEY ("zap_id") REFERENCES "public"."zaps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_zap_id_zaps_id_fk" FOREIGN KEY ("zap_id") REFERENCES "public"."zaps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_available_trigger_id_available_triggers_id_fk" FOREIGN KEY ("available_trigger_id") REFERENCES "public"."available_triggers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zaps" ADD CONSTRAINT "zaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;