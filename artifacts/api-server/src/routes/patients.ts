import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, appointmentsTable, prescriptionsTable, prescriptionItemsTable, labTestsTable, doctorsTable } from "@workspace/db";
import { eq, or, ilike, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/patients", requireAuth, async (req, res): Promise<void> => {
  const search = req.query["search"] as string | undefined;
  let patients;
  if (search) {
    patients = await db.select().from(patientsTable)
      .where(or(ilike(patientsTable.name, `%${search}%`), ilike(patientsTable.phone, `%${search}%`)));
  } else {
    patients = await db.select().from(patientsTable).orderBy(patientsTable.createdAt);
  }
  res.json(patients.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/patients", requireAuth, async (req, res): Promise<void> => {
  const { name, gender, phone, dateOfBirth, email, address, bloodGroup, allergies, chronicConditions } = req.body;
  if (!name || !gender || !phone) {
    res.status(400).json({ error: "Name, gender, and phone are required" });
    return;
  }
  const [patient] = await db.insert(patientsTable).values({
    name, gender, phone, dateOfBirth, email, address, bloodGroup, allergies, chronicConditions
  }).returning();
  res.status(201).json({ ...patient!, createdAt: patient!.createdAt.toISOString() });
});

router.get("/patients/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const appointments = await db.select({
    id: appointmentsTable.id, patientId: appointmentsTable.patientId, doctorId: appointmentsTable.doctorId,
    appointmentDate: appointmentsTable.appointmentDate, timeSlot: appointmentsTable.timeSlot,
    status: appointmentsTable.status, reason: appointmentsTable.reason, notes: appointmentsTable.notes,
    createdAt: appointmentsTable.createdAt, doctorName: doctorsTable.name
  })
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(eq(appointmentsTable.patientId, id))
    .orderBy(appointmentsTable.appointmentDate);

  const labTests = await db.select().from(labTestsTable).where(eq(labTestsTable.patientId, id));

  const prescriptionsRaw = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.patientId, id));
  const prescriptions = await Promise.all(prescriptionsRaw.map(async (p) => {
    const items = await db.select().from(prescriptionItemsTable).where(eq(prescriptionItemsTable.prescriptionId, p.id));
    return { ...p, items, createdAt: p.createdAt.toISOString() };
  }));

  res.json({
    ...patient,
    createdAt: patient.createdAt.toISOString(),
    appointments: appointments.map(a => ({ ...a, patientName: patient.name, createdAt: a.createdAt.toISOString() })),
    prescriptions,
    labTests: labTests.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
  });
});

router.patch("/patients/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { name, gender, phone, dateOfBirth, email, address, bloodGroup, allergies, chronicConditions } = req.body;
  const [patient] = await db.update(patientsTable)
    .set({ name, gender, phone, dateOfBirth, email, address, bloodGroup, allergies, chronicConditions })
    .where(eq(patientsTable.id, id))
    .returning();
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json({ ...patient, createdAt: patient.createdAt.toISOString() });
});

export default router;
