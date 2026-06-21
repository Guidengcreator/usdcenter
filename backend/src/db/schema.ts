import { serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const clinicInformation = pgTable("clinic_information", {
  id: serial("id").primaryKey(),
  clinicName: varchar("clinic_name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
