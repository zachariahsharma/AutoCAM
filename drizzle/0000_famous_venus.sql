CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "box_tubes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "box_tubes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"epic" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"cam_download_url" text
);
--> statement-breakpoint
CREATE TABLE "part_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "part_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"material" text NOT NULL,
	"thickness" numeric NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT "part_categories_team_id_material_thickness_unique" UNIQUE("team_id","material","thickness")
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" integer GENERATED ALWAYS AS IDENTITY (sequence name "parts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"epic" text NOT NULL,
	"ticket" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "parts_id_category_id_pk" PRIMARY KEY("id","category_id")
);
--> statement-breakpoint
CREATE TABLE "parts_to_plates" (
	"category_id" integer NOT NULL,
	"plate_id" integer NOT NULL,
	"part_id" integer NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plates" (
	"id" integer GENERATED ALWAYS AS IDENTITY (sequence name "plates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"width" numeric NOT NULL,
	"length" numeric NOT NULL,
	"true_depth" numeric NOT NULL,
	"category_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"cam_download_url" text,
	"screenshot_url" text,
	CONSTRAINT "plates_id_category_id_pk" PRIMARY KEY("id","category_id")
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" integer NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "team_runners" (
	"team_id" integer NOT NULL,
	"digest" char(64) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "team_runners_team_id_name_pk" PRIMARY KEY("team_id","name")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"number" integer NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_categories" ADD CONSTRAINT "part_categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_category_id_part_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."part_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_to_plates" ADD CONSTRAINT "parts_to_plates_category_id_part_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."part_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_to_plates" ADD CONSTRAINT "parts_to_plates_part_id_category_id_parts_id_category_id_fk" FOREIGN KEY ("part_id","category_id") REFERENCES "public"."parts"("id","category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_to_plates" ADD CONSTRAINT "parts_to_plates_plate_id_category_id_plates_id_category_id_fk" FOREIGN KEY ("plate_id","category_id") REFERENCES "public"."plates"("id","category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plates" ADD CONSTRAINT "plates_category_id_part_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."part_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_runners" ADD CONSTRAINT "team_runners_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");