ALTER TABLE "clinic_information" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clinic_information" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "clinic_information" ADD COLUMN "email" varchar(254);--> statement-breakpoint
UPDATE "clinic_information"
SET
  "address" = COALESCE("address", 'м. Київ, вул. Прикладна, 10'),
  "phone" = COALESCE("phone", '+380 44 123 45 67'),
  "email" = COALESCE("email", 'info@uzdexpert.ua')
WHERE "address" IS NULL OR "phone" IS NULL OR "email" IS NULL;--> statement-breakpoint
ALTER TABLE "clinic_information" ALTER COLUMN "address" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clinic_information" ALTER COLUMN "phone" SET NOT NULL;
