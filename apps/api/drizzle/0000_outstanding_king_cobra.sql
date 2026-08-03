CREATE TABLE "heroes" (
	"user_id" text PRIMARY KEY NOT NULL,
	"hero_name" text NOT NULL,
	"class" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"equipped" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_templates" (
	"template_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slot" text NOT NULL,
	"rarity" text NOT NULL,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"allowed_classes" jsonb,
	"description" text,
	"mint_candidate" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"template_id" text NOT NULL,
	"name" text NOT NULL,
	"slot" text,
	"rarity" text NOT NULL,
	"state" text NOT NULL,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"allowed_classes" jsonb,
	"description" text,
	"equipped" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"picture" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "heroes" ADD CONSTRAINT "heroes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;