import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, patientsTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function enrichAppointment(appt: typeof appointmentsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, appt.patientId));
  const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, appt.doctorId));
  return {
    ...appt,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
    createdAt: appt.createdAt.toISOString(),
  };
}

router.get("/appointments", requireAuth, async (req, res): Promise<void> => {
  const { patientId, doctorId, date, status } = req.query;
  let query = db.select().from(appointmentsTable);
  const conditions = [];
  if (patientId) conditions.push(eq(appointmentsTable.patientId, parseInt(patientId as string, 10)));
  if (doctorId) conditions.push(eq(appointmentsTable.doctorId, parseInt(doctorId as string, 10)));
  if (date) conditions.push(eq(appointmentsTable.appointmentDate, date as string));
  if (status) conditions.push(eq(appointmentsTable.status, status as string));

  const appointments = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(appointmentsTable.appointmentDate)
    : await query.orderBy(appointmentsTable.appointmentDate);

  const enriched = await Promise.all(appointments.map(enrichAppointment));
  res.json(enriched);
});

router.post("/appointments", requireAuth, async (req, res): Promise<void> => {
  const { patientId, doctorId, appointmentDate, timeSlot, reason } = req.body;
  if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
    res.status(400).json({ error: "Patient, doctor, date, and time slot are required" });
    return;
  }
  const [appt] = await db.insert(appointmentsTable).values({
    patientId, doctorId, appointmentDate, timeSlot, reason, status: "scheduled"
  }).returning();
  const enriched = await enrichAppointment(appt!);
  res.status(201).json(enriched);
});

router.get("/appointments/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) { res.status(404).json({ error: "Appointment not found" }); return; }
  res.json(await enrichAppointment(appt));
});

router.patch("/appointments/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { status, notes, appointmentDate, timeSlot } = req.body;
  const [appt] = await db.update(appointmentsTable)
    .set({ status, notes, appointmentDate, timeSlot })
    .where(eq(appointmentsTable.id, id))
    .returning();
  if (!appt) { res.status(404).json({ error: "Appointment not found" }); return; }
  res.json(await enrichAppointment(appt));
});

export default router;
