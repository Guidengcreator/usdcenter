ALTER TABLE "clinic_information" ADD COLUMN "working_hours" text;--> statement-breakpoint
UPDATE "clinic_information"
SET "working_hours" = COALESCE(
  "working_hours",
  'Пн-Пт: 09:00-18:00
Сб: 09:00-14:00
Нд: вихідний'
)
WHERE "working_hours" IS NULL;--> statement-breakpoint
ALTER TABLE "clinic_information" ALTER COLUMN "working_hours" SET NOT NULL;
