import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const clinicInformation = pgTable("clinic_information", {
  id: serial("id").primaryKey(),
  clinicName: varchar("clinic_name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 254 }),
  workingHours: text("working_hours").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appointmentRequests = pgTable("appointment_requests", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 254 }),
  serviceType: varchar("service_type", { length: 200 }),
  comment: text("comment"),
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
