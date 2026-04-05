import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, prescriptionItemsTable, patientsTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function enrichPrescription(p: typeof prescriptionsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, p.patientId));
  const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, p.doctorId));
  const items = await db.select().from(prescriptionItemsTable).where(eq(prescriptionItemsTable.prescriptionId, p.id));
  return {
    ...p,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
    items,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/prescriptions", requireAuth, async (req, res): Promise<void> => {
  const { patientId, doctorId, appointmentId } = req.query;
  const conditions = [];
  if (patientId) conditions.push(eq(prescriptionsTable.patientId, parseInt(patientId as string, 10)));
  if (doctorId) conditions.push(eq(prescriptionsTable.doctorId, parseInt(doctorId as string, 10)));
  if (appointmentId) conditions.push(eq(prescriptionsTable.appointmentId, parseInt(appointmentId as string, 10)));
  const prescriptions = conditions.length > 0
    ? await db.select().from(prescriptionsTable).where(and(...conditions)).orderBy(prescriptionsTable.createdAt)
    : await db.select().from(prescriptionsTable).orderBy(prescriptionsTable.createdAt);
  const enriched = await Promise.all(prescriptions.map(enrichPrescription));
  res.json(enriched);
});

router.post("/prescriptions", requireAuth, async (req, res): Promise<void> => {
  const { patientId, doctorId, appointmentId, diagnosis, notes, items } = req.body;
  if (!patientId || !doctorId || !diagnosis || !items?.length) {
    res.status(400).json({ error: "Patient, doctor, diagnosis, and at least one item are required" });
    return;
  }
  const [prescription] = await db.insert(prescriptionsTable).values({
    patientId, doctorId, appointmentId, diagnosis, notes
  }).returning();
  await db.insert(prescriptionItemsTable).values(
    items.map((item: { medicineName: string; dosage: string; frequency: string; duration: string; instructions?: string }) => ({
      prescriptionId: prescription!.id,
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions,
    }))
  );
  res.status(201).json(await enrichPrescription(prescription!));
});

router.get("/prescriptions/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [p] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, id));
  if (!p) { res.status(404).json({ error: "Prescription not found" }); return; }
  res.json(await enrichPrescription(p));
});

export default router;
