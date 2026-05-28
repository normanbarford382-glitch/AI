import { Router } from "express";
import { db, eq, categories } from "../db";
import { authMiddleware, adminOnly } from "../lib/auth";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const cats = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
    res.json({ categories: cats });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/categories", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [cat] = await db.insert(categories).values(req.body).returning();
    res.json({ category: cat });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/categories/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = String(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };
    const [cat] = await db.update(categories).set(updateData as typeof categories.$inferInsert).where(eq(categories.id, id)).returning();
    res.json({ category: cat });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/categories/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = String(req.params.id);
    await db.update(categories).set({ isActive: false } as Partial<typeof categories.$inferInsert>).where(eq(categories.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
