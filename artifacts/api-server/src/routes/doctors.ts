import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { doctorsTable, usersTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/doctors", requireAuth, async (req, res): Promise<void> => {
  const specialization = req.query["specialization"] as string | undefined;
  let doctors;
  if (specialization) {
    doctors = await db.select().from(doctorsTable).where(ilike(doctorsTable.specialization, `%${specialization}%`));
  } else {
    doctors = await db.select().from(doctorsTable).orderBy(doctorsTable.name);
  }
  res.json(doctors.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

router.post("/doctors", requireAuth, async (req, res): Promise<void> => {
  const { name, specialization, department, phone, email, licenseNumber, yearsOfExperience, username, password } = req.body;
  if (!name || !specialization || !username || !password) {
    res.status(400).json({ error: "Name, specialization, username, and password are required" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, passwordHash, role: "doctor", name, email }).returning();
  const [doctor] = await db.insert(doctorsTable).values({
    userId: user!.id, name, specialization, department, phone, email, licenseNumber, yearsOfExperience
  }).returning();
  res.status(201).json({ ...doctor!, createdAt: doctor!.createdAt.toISOString() });
});

router.get("/doctors/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
  if (!doctor) { res.status(404).json({ error: "Doctor not found" }); return; }
  res.json({ ...doctor, createdAt: doctor.createdAt.toISOString() });
});

export default router;
