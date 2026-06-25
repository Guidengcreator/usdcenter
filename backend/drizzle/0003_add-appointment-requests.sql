CREATE TABLE "appointment_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"email" varchar(254),
	"service_type" varchar(200),
	"comment" text,
	"status" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
