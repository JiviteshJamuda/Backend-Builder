import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, doctorsTable, appointmentsTable, labTestsTable, medicinesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0]!;

  const [patientCount] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable);
  const [doctorCount] = await db.select({ count: sql<number>`count(*)` }).from(doctorsTable);
  const [todayAppts] = await db.select({ count: sql<number>`count(*)` }).from(appointmentsTable)
    .where(eq(appointmentsTable.appointmentDate, today));
  const [completedToday] = await db.select({ count: sql<number>`count(*)` }).from(appointmentsTable)
    .where(sql`${appointmentsTable.appointmentDate} = ${today} AND ${appointmentsTable.status} = 'completed'`);
  const [pendingLab] = await db.select({ count: sql<number>`count(*)` }).from(labTestsTable)
    .where(eq(labTestsTable.status, "pending"));
  const [lowStock] = await db.select({ count: sql<number>`count(*)` }).from(medicinesTable)
    .where(sql`${medicinesTable.stockQuantity} <= ${medicinesTable.minimumStock}`);

  res.json({
    totalPatients: Number(patientCount?.count ?? 0),
    totalDoctors: Number(doctorCount?.count ?? 0),
    todayAppointments: Number(todayAppts?.count ?? 0),
    completedAppointmentsToday: Number(completedToday?.count ?? 0),
    pendingLabTests: Number(pendingLab?.count ?? 0),
    lowStockMedicines: Number(lowStock?.count ?? 0),
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (req, res): Promise<void> => {
  const recentAppointments = await db.select().from(appointmentsTable)
    .orderBy(appointmentsTable.createdAt).limit(5);
  const recentLabTests = await db.select().from(labTestsTable)
    .orderBy(labTestsTable.createdAt).limit(5);
  const recentPatients = await db.select().from(patientsTable)
    .orderBy(patientsTable.createdAt).limit(5);

  const activities = [
    ...recentAppointments.map(a => ({
      id: `appt-${a.id}`,
      type: "appointment",
      description: `Appointment scheduled for ${a.appointmentDate} at ${a.timeSlot}`,
      timestamp: a.createdAt.toISOString(),
      relatedId: a.id,
    })),
    ...recentLabTests.map(t => ({
      id: `lab-${t.id}`,
      type: "lab_test",
      description: `${t.testName} test ordered - status: ${t.status}`,
      timestamp: t.createdAt.toISOString(),
      relatedId: t.id,
    })),
    ...recentPatients.map(p => ({
      id: `patient-${p.id}`,
      type: "patient",
      description: `New patient registered: ${p.name}`,
      timestamp: p.createdAt.toISOString(),
      relatedId: p.id,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  res.json(activities);
});

export default router;
