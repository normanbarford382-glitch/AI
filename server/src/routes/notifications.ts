import { Router } from "express";
import { db, eq, desc, notifications } from "../db";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const notifs = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
    res.json({ notifications: notifs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/notifications/read", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
