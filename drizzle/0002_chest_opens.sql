CREATE TABLE IF NOT EXISTS "chest_opens" (
	"user_id" text NOT NULL,
	"chest_id" text NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chest_opens_user_id_chest_id_unique" UNIQUE("user_id","chest_id")
);
--> statement-breakpoint
ALTER TABLE "chest_opens" ADD CONSTRAINT "chest_opens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
