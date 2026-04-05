import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { labTestsTable, patientsTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function enrichLabTest(t: typeof labTestsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, t.patientId));
  const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, t.doctorId));
  return {
    ...t,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/lab-tests", requireAuth, async (req, res): Promise<void> => {
  const { patientId, status } = req.query;
  const conditions = [];
  if (patientId) conditions.push(eq(labTestsTable.patientId, parseInt(patientId as string, 10)));
  if (status) conditions.push(eq(labTestsTable.status, status as string));
  const tests = conditions.length > 0
    ? await db.select().from(labTestsTable).where(and(...conditions)).orderBy(labTestsTable.createdAt)
    : await db.select().from(labTestsTable).orderBy(labTestsTable.createdAt);
  const enriched = await Promise.all(tests.map(enrichLabTest));
  res.json(enriched);
});

router.post("/lab-tests", requireAuth, async (req, res): Promise<void> => {
  const { patientId, doctorId, appointmentId, testName, testType, normalRange, scheduledDate } = req.body;
  if (!patientId || !doctorId || !testName || !testType) {
    res.status(400).json({ error: "Patient, doctor, test name, and test type are required" });
    return;
  }
  const [test] = await db.insert(labTestsTable).values({
    patientId, doctorId, appointmentId, testName, testType, normalRange, scheduledDate, status: "pending"
  }).returning();
  res.status(201).json(await enrichLabTest(test!));
});

router.get("/lab-tests/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [test] = await db.select().from(labTestsTable).where(eq(labTestsTable.id, id));
  if (!test) { res.status(404).json({ error: "Lab test not found" }); return; }
  res.json(await enrichLabTest(test));
});

router.patch("/lab-tests/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { status, results, remarks, completedDate } = req.body;
  const [test] = await db.update(labTestsTable)
    .set({ status, results, remarks, completedDate })
    .where(eq(labTestsTable.id, id))
    .returning();
  if (!test) { res.status(404).json({ error: "Lab test not found" }); return; }
  res.json(await enrichLabTest(test));
});

export default router;
