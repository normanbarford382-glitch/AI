import { Router } from "express";
import { db, eq, and, wishlistItems, products, categories } from "../db";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/wishlist", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const items = await db.select().from(wishlistItems)
      .leftJoin(products, eq(wishlistItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(wishlistItems.userId, userId));
    res.json({ items: items.map(i => ({ ...i.wishlist_items, product: { ...i.products, category: i.categories } })) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/wishlist", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.body;
    const existing = await db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))).limit(1);
    if (existing[0]) {
      await db.delete(wishlistItems).where(eq(wishlistItems.id, existing[0].id));
      res.json({ action: "removed" });
    } else {
      await db.insert(wishlistItems).values({ userId, productId });
      res.json({ action: "added" });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
