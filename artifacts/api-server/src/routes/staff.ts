import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { ne } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/staff", requireAuth, async (req, res): Promise<void> => {
  const staff = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    role: usersTable.role,
    email: usersTable.email,
    username: usersTable.username,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(ne(usersTable.role, "patient")).orderBy(usersTable.name);

  res.json(staff.map(s => ({
    ...s,
    department: null,
    phone: null,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/staff", requireAuth, async (req, res): Promise<void> => {
  const { name, role, department, phone, email, username, password } = req.body;
  if (!name || !role || !username || !password) {
    res.status(400).json({ error: "Name, role, username, and password are required" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, passwordHash, role, name, email }).returning();
  res.status(201).json({
    id: user!.id,
    name: user!.name,
    role: user!.role,
    department,
    phone,
    email: user!.email,
    username: user!.username,
    createdAt: user!.createdAt.toISOString(),
  });
});

export default router;
