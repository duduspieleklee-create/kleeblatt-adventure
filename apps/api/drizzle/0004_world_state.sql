-- Persistent game world state tables
CREATE TABLE "world_maps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"map_id" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"tile_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "world_map_tiles" (
	"id" text PRIMARY KEY NOT NULL,
	"map_id" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"tileset_key" text NOT NULL,
	"tile_index" integer NOT NULL,
	"layer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "world_enemies" (
	"id" text PRIMARY KEY NOT NULL,
	"map_id" text NOT NULL,
	"user_id" text NOT NULL,
	"enemy_type" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"hp" integer NOT NULL,
	"max_hp" integer NOT NULL,
	"state" text NOT NULL,
	"spawn_point_x" integer NOT NULL,
	"spawn_point_y" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "world_chests" (
	"id" text PRIMARY KEY NOT NULL,
	"map_id" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"chest_id" text NOT NULL,
	"item_template_id" text,
	"opened" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "world_npc_positions" (
	"id" text PRIMARY KEY NOT NULL,
	"map_id" text NOT NULL,
	"npc_id" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "world_map_tiles" ADD CONSTRAINT "world_map_tiles_map_id_world_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."world_maps"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "world_enemies" ADD CONSTRAINT "world_enemies_map_id_world_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."world_maps"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "world_enemies" ADD CONSTRAINT "world_enemies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "world_chests" ADD CONSTRAINT "world_chests_map_id_world_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."world_maps"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "world_npc_positions" ADD CONSTRAINT "world_npc_positions_map_id_world_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."world_maps"("id") ON DELETE cascade ON UPDATE no action;