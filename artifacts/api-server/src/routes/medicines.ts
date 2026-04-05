import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { medicinesTable } from "@workspace/db";
import { eq, ilike, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function formatMedicine(m: typeof medicinesTable.$inferSelect) {
  return {
    ...m,
    price: parseFloat(String(m.price)),
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/medicines", requireAuth, async (req, res): Promise<void> => {
  const { search, lowStock } = req.query;
  let medicines;
  if (lowStock === "true") {
    medicines = await db.select().from(medicinesTable)
      .where(sql`${medicinesTable.stockQuantity} <= ${medicinesTable.minimumStock}`)
      .orderBy(medicinesTable.name);
  } else if (search) {
    medicines = await db.select().from(medicinesTable)
      .where(ilike(medicinesTable.name, `%${search}%`))
      .orderBy(medicinesTable.name);
  } else {
    medicines = await db.select().from(medicinesTable).orderBy(medicinesTable.name);
  }
  res.json(medicines.map(formatMedicine));
});

router.post("/medicines", requireAuth, async (req, res): Promise<void> => {
  const { name, genericName, category, manufacturer, stockQuantity, unit, price, expiryDate, minimumStock } = req.body;
  if (!name) {
    res.status(400).json({ error: "Medicine name is required" });
    return;
  }
  const [med] = await db.insert(medicinesTable).values({
    name, genericName, category, manufacturer,
    stockQuantity: stockQuantity ?? 0,
    unit: unit ?? "tablet",
    price: String(price ?? 0),
    expiryDate,
    minimumStock: minimumStock ?? 10
  }).returning();
  res.status(201).json(formatMedicine(med!));
});

router.patch("/medicines/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { name, genericName, category, stockQuantity, price, expiryDate, minimumStock } = req.body;
  const [med] = await db.update(medicinesTable)
    .set({ name, genericName, category, stockQuantity, price: price != null ? String(price) : undefined, expiryDate, minimumStock })
    .where(eq(medicinesTable.id, id))
    .returning();
  if (!med) { res.status(404).json({ error: "Medicine not found" }); return; }
  res.json(formatMedicine(med));
});

export default router;
