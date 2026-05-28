import { Router } from "express";
import { db, eq, desc, isNotNull, and, sql, products, categories, banners, reviews, siteSettings } from "../db";
import { buildSettingsMap } from "../lib/siteSettings";

const router = Router();

router.get("/settings", async (req, res) => {
  try {
    const rows = await db.select().from(siteSettings);
    res.json({ settings: buildSettingsMap(rows) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function enrichProducts(prods: any[], allRevs: any[]) {
  return prods.map(p => {
    const revs = allRevs.filter(r => r.productId === p.id);
    const avg = revs.length ? revs.reduce((a: number, r: any) => a + r.rating, 0) / revs.length : 0;
    return { ...p, avgRating: avg, reviewCount: revs.length };
  });
}

router.get("/home", async (req, res) => {
  try {
    const [bannerRows, featuredRows, categoryRows, offersRows] = await Promise.all([
      db.select().from(banners).where(eq(banners.isActive, true)).orderBy(banners.sortOrder),
      db.select().from(products).leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
        .orderBy(desc(products.createdAt)).limit(8),
      db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder),
      db.select().from(products).leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(isNotNull(products.discountPrice), eq(products.isActive, true)))
        .orderBy(desc(products.createdAt)).limit(6),
    ]);

    const allProductIds = [...featuredRows, ...offersRows].map(r => r.products.id);
    const allRevs = allProductIds.length ? await db.select({ productId: reviews.productId, rating: reviews.rating })
      .from(reviews).where(sql`${reviews.productId} = ANY(ARRAY[${sql.join(allProductIds.map(id => sql`${id}`), sql`, `)}])`) : [];

    const featuredProducts = enrichProducts(featuredRows.map(r => ({ ...r.products, category: r.categories })), allRevs);
    const offersProducts = enrichProducts(offersRows.map(r => ({ ...r.products, category: r.categories })), allRevs);

    res.json({ banners: bannerRows, featuredProducts, categories: categoryRows, offersProducts });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
