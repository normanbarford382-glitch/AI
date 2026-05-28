import { Router } from "express";
import { db, eq, and, lt, coupons, couponUsages } from "../db";
import { authMiddleware, adminOnly } from "../lib/auth";

const router = Router();

router.post("/coupons/validate", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { code, orderTotal } = req.body;

    const coupon = await db.select().from(coupons).where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true))).limit(1);
    if (!coupon[0]) { res.status(400).json({ error: "كوبون غير صالح" }); return; }
    if (coupon[0].expiresAt && coupon[0].expiresAt < new Date()) { res.status(400).json({ error: "الكوبون منتهي الصلاحية" }); return; }
    if (coupon[0].maxUses && coupon[0].usedCount >= coupon[0].maxUses) { res.status(400).json({ error: "تجاوز الحد الأقصى للاستخدام" }); return; }
    if (coupon[0].minOrderValue && orderTotal < coupon[0].minOrderValue) { res.status(400).json({ error: `الحد الأدنى للطلب ${coupon[0].minOrderValue}` }); return; }

    const usage = await db.select().from(couponUsages).where(and(eq(couponUsages.couponId, coupon[0].id), eq(couponUsages.userId, userId))).limit(1);
    if (usage[0]) { res.status(400).json({ error: "استخدمت هذا الكوبون مسبقاً" }); return; }

    let discountAmount = 0;
    if (coupon[0].discountType === "PERCENT") discountAmount = (orderTotal * coupon[0].discountValue) / 100;
    else discountAmount = Math.min(coupon[0].discountValue, orderTotal);

    res.json({ coupon: coupon[0], discountAmount, finalTotal: orderTotal - discountAmount });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/coupons", authMiddleware, adminOnly, async (req, res) => {
  try {
    const allCoupons = await db.select().from(coupons);
    res.json({ coupons: allCoupons });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/coupons", authMiddleware, adminOnly, async (req, res) => {
  try {
    const body = { ...req.body, code: req.body.code?.toUpperCase() };
    const [coupon] = await db.insert(coupons).values(body).returning();
    res.json({ coupon });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
