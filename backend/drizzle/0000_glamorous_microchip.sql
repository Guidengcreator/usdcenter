CREATE TABLE "clinic_information" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
