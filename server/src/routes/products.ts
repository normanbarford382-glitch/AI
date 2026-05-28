import { Router } from "express";
import { db, eq, and, ilike, or, sql, desc, asc, isNull, isNotNull, lte, gte, gt, products, categories, reviews, wishlistItems } from "../db";
import { authMiddleware, adminOnly, optionalAuth } from "../lib/auth";

const router = Router();

function enrichProduct(p: any, revs: any[]) {
  const avg = revs.length ? revs.reduce((a: number, r: any) => a + r.rating, 0) / revs.length : 0;
  return { ...p, avgRating: avg, reviewCount: revs.length };
}

router.get("/products", optionalAuth, async (req, res) => {
  try {
    const { page = "1", limit: lim = "12", q, category, featured, offers, minPrice, maxPrice, sort = "newest", brand, inStock } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const pageSize = parseInt(lim);
    const offset = (pageNum - 1) * pageSize;

    const conditions = [eq(products.isActive, true)];
    if (q) conditions.push(or(ilike(products.nameAr, `%${q}%`), ilike(products.nameEn, `%${q}%`), ilike(products.brand, `%${q}%`))!);
    if (featured === "true") conditions.push(eq(products.isFeatured, true));
    if (offers === "true") conditions.push(isNotNull(products.discountPrice));
    if (brand) conditions.push(ilike(products.brand, brand));
    if (inStock === "true") conditions.push(gt(products.stock, 0));
    if (minPrice) conditions.push(gte(products.price, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(products.price, parseFloat(maxPrice)));

    let categoryId: string | undefined;
    if (category) {
      const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category)).limit(1);
      if (cat[0]) categoryId = cat[0].id;
      if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    }

    const orderBy = sort === "price_asc" ? asc(products.price) : sort === "price_desc" ? desc(products.price) : desc(products.createdAt);
    const where = and(...conditions);

    const [rows, countResult, cats] = await Promise.all([
      db.select().from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(where).orderBy(orderBy).limit(pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(products).where(where),
      db.select().from(categories).where(eq(categories.isActive, true)),
    ]);

    const brands = await db.selectDistinct({ brand: products.brand }).from(products).where(eq(products.isActive, true));

    const allRevs = rows.length ? await db.select({ productId: reviews.productId, rating: reviews.rating }).from(reviews).where(
      sql`${reviews.productId} IN (${sql.join(rows.map(r => sql`${r.products.id}`), sql`, `)})`
    ) : [];

    const enriched = rows.map(r => {
      const revs = allRevs.filter(rv => rv.productId === r.products.id);
      return enrichProduct({ ...r.products, category: r.categories }, revs);
    });

    const total = Number(countResult[0]?.count ?? 0);
    res.json({ products: enriched, total, totalPages: Math.ceil(total / pageSize), page: pageNum, categories: cats, brands: brands.map(b => b.brand).filter(Boolean) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/products/:id", optionalAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const byId = await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id)).limit(1);
    const bySlug = byId[0] ? [] : await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, id)).limit(1);
    const row = (byId[0] ?? bySlug[0]);

    if (!row || !row.products.isActive) { res.status(404).json({ error: "Not found" }); return; }

    const revs = await db.select().from(reviews)
      .where(eq(reviews.productId, row.products.id));
    const approvedRevs = revs.filter(r => r.isApproved);

    res.json({
      product: {
        ...enrichProduct({ ...row.products, category: row.categories }, approvedRevs),
        reviews: approvedRevs,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/products/:id/reviews", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { rating, comment } = req.body;
    const id = String(req.params.id);

    const allExisting = await db.select().from(reviews).where(eq(reviews.productId, id)).limit(100);
    const existing = allExisting.filter(r => r.userId === userId);
    if (existing.length > 0) { res.status(400).json({ error: "Already reviewed" }); return; }

    const [review] = await db.insert(reviews).values({ userId, productId: id, rating: Number(rating), comment }).returning();
    res.json({ review });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/products", authMiddleware, adminOnly, async (req, res) => {
  try {
    const body = req.body;
    const slug = body.slug || `${body.nameEn?.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const [product] = await db.insert(products).values({ ...body, slug, images: body.images || [], tags: body.tags || [] }).returning();
    res.json({ product });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/products/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = String(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };
    const [product] = await db.update(products).set(updateData as typeof products.$inferInsert).where(eq(products.id, id)).returning();
    res.json({ product });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/products/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = String(req.params.id);
    await db.update(products).set({ isActive: false } as Partial<typeof products.$inferInsert>).where(eq(products.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
