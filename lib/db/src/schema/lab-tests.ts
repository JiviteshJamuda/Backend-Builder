import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const labTestsTable = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  appointmentId: integer("appointment_id"),
  testName: text("test_name").notNull(),
  testType: text("test_type").notNull(),
  status: text("status").notNull().default("pending"),
  results: text("results"),
  normalRange: text("normal_range"),
  remarks: text("remarks"),
  scheduledDate: text("scheduled_date"),
  completedDate: text("completed_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLabTestSchema = createInsertSchema(labTestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTestsTable.$inferSelect;
