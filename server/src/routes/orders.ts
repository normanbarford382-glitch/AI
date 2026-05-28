import { Router } from "express";
import { db, eq, and, desc, sql, orders, orderItems, products, coupons, couponUsages, wallets, walletTransactions, siteSettings, users, notifications } from "../db";
import { authMiddleware, adminOnly } from "../lib/auth";
import { normalizeCheckoutPaymentMode } from "../lib/checkoutPayment";
import { parseSettingBool } from "../lib/siteSettings";

const router = Router();

router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);

    const orderRows = isAdmin
      ? await db.select().from(orders).orderBy(desc(orders.createdAt))
      : await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(orderRows.map(async (order) => {
      const items = await db.select().from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));
      const user = isAdmin
        ? await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1)
        : null;
      return { ...order, items, user: user?.[0] };
    }));

    res.json({ orders: ordersWithItems });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);

    const orderId = String(req.params.id);
    const orderById = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = isAdmin ? orderById : orderById.filter(o => o.userId === userId);

    if (!order[0]) { res.status(404).json({ error: "Not found" }); return; }

    const items = await db.select().from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order[0].id));

    res.json({ order: { ...order[0], items } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/orders", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const lang = req.body.lang || "ar";
    const { fullName, phone, address, shippingBranch, useWallet, couponCode, items: cartItems, notes } = req.body;

    if (!fullName || !phone || !address) {
      res.status(400).json({ error: lang === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields" });
      return;
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      res.status(400).json({ error: lang === "ar" ? "السلة فارغة" : "Cart is empty" });
      return;
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const itemsWithPrices: { productId: string; quantity: number; price: number }[] = [];

    for (const item of cartItems as { productId: string; quantity: number }[]) {
      const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product[0]) {
        res.status(400).json({ error: lang === "ar" ? `منتج غير موجود` : `Product not found` });
        return;
      }
      if (product[0].stock < item.quantity) {
        const name = lang === "ar" ? product[0].nameAr : product[0].nameEn;
        res.status(400).json({ error: lang === "ar" ? `الكمية المطلوبة غير متوفرة لـ: ${name}` : `Insufficient stock for: ${name}` });
        return;
      }
      const price = product[0].discountPrice ?? product[0].price;
      totalAmount += price * item.quantity;
      itemsWithPrices.push({ productId: item.productId, quantity: item.quantity, price });
    }

    // Apply coupon
    let discountAmount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await db.select().from(coupons).where(
        and(eq(coupons.code, couponCode.toUpperCase()), eq(coupons.isActive, true))
      ).limit(1);
      if (coupon[0]) {
        const usage = await db.select().from(couponUsages).where(
          and(eq(couponUsages.couponId, coupon[0].id), eq(couponUsages.userId, userId))
        ).limit(1);
        if (!usage[0]) {
          if (coupon[0].discountType === "PERCENT") discountAmount = (totalAmount * coupon[0].discountValue) / 100;
          else discountAmount = Math.min(coupon[0].discountValue, totalAmount);
          couponId = coupon[0].id;
        }
      }
    }
    const finalTotal = totalAmount - discountAmount;

    const [walletSettingRow, paymentModeRow] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.key, "walletEnabled")).limit(1),
      db.select().from(siteSettings).where(eq(siteSettings.key, "checkoutPaymentMode")).limit(1),
    ]);
    const walletEnabled = parseSettingBool(walletSettingRow[0]?.value);
    const checkoutMode = normalizeCheckoutPaymentMode(paymentModeRow[0]?.value);

    let paidFromWallet = false;
    let walletAmountUsed = 0;

    const wantsWallet = useWallet || checkoutMode === "wallet";

    if (wantsWallet) {
      if (checkoutMode === "cod") {
        res.status(400).json({ error: lang === "ar" ? "الدفع من المحفظة غير متاح حالياً" : "Wallet payment is not available" });
        return;
      }
      if (!walletEnabled) {
        res.status(400).json({ error: lang === "ar" ? "المحفظة غير مفعّلة حالياً" : "Wallet is not enabled" });
        return;
      }

      const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
      if (!wallet[0] || wallet[0].balance < finalTotal) {
        res.status(400).json({
          error: lang === "ar"
            ? `لا يوجد رصيد كافٍ في المحفظة. الرصيد الحالي: ${wallet[0]?.balance?.toFixed(0) ?? 0} `
            : `Insufficient wallet balance. Current balance: ${wallet[0]?.balance?.toFixed(0) ?? 0} SYP`,
        });
        return;
      }
      paidFromWallet = true;
      walletAmountUsed = finalTotal;
    } else if (checkoutMode === "wallet") {
      res.status(400).json({ error: lang === "ar" ? "يجب الدفع من المحفظة" : "Wallet payment is required" });
      return;
    }

    // Create order
    const [order] = await db.insert(orders).values({
      userId, fullName, phone, address, shippingBranch: shippingBranch || null,
      totalAmount: finalTotal, paidFromWallet,
      walletAmountUsed: paidFromWallet ? walletAmountUsed : null,
      couponId, discountAmount: discountAmount > 0 ? discountAmount : null,
      notes: notes || null,
      status: "PENDING",
    }).returning();

    // Insert order items
    await db.insert(orderItems).values(itemsWithPrices.map(i => ({ orderId: order.id, ...i })));

    // Reduce stock
    for (const item of itemsWithPrices) {
      await db.update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));
    }

    // Deduct wallet balance
    if (paidFromWallet) {
      const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
      if (wallet[0]) {
        const newBalance = wallet[0].balance - walletAmountUsed;
        await db.update(wallets).set({ balance: newBalance, updatedAt: new Date() }).where(eq(wallets.id, wallet[0].id));
        await db.insert(walletTransactions).values({
          walletId: wallet[0].id,
          amount: -walletAmountUsed,
          type: "PURCHASE",
          description: `Order #${order.id.slice(-8).toUpperCase()}`,
        });
      }
    }

    // Apply coupon usage
    if (couponId) {
      await db.insert(couponUsages).values({ couponId, userId });
      await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, couponId));
    }

    // Notify user
    await db.insert(notifications).values({
      userId,
      titleAr: "تم استلام طلبك",
      titleEn: "Order Received",
      bodyAr: `تم تأكيد طلبك رقم #${order.id.slice(-8).toUpperCase()} وهو قيد المعالجة`,
      bodyEn: `Your order #${order.id.slice(-8).toUpperCase()} has been confirmed and is being processed`,
      link: `/orders/${order.id}`,
    });

    res.json({ success: true, order });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/orders/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" }); return;
    }

    const orderId = String(req.params.id);
    const [order] = await db.update(orders).set({ status, updatedAt: new Date() } as Partial<typeof orders.$inferInsert>).where(eq(orders.id, orderId)).returning();
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    // Notify user of status change
    const statusMessages: Record<string, { ar: string; en: string }> = {
      PROCESSING: { ar: "طلبك قيد المعالجة", en: "Your order is being processed" },
      SHIPPED: { ar: "تم شحن طلبك", en: "Your order has been shipped" },
      DELIVERED: { ar: "تم توصيل طلبك", en: "Your order has been delivered" },
      CANCELLED: { ar: "تم إلغاء طلبك", en: "Your order has been cancelled" },
    };
    const msg = statusMessages[status];
    if (msg) {
      await db.insert(notifications).values({
        userId: order.userId,
        titleAr: msg.ar,
        titleEn: msg.en,
        bodyAr: `طلب رقم #${order.id.slice(-8).toUpperCase()}`,
        bodyEn: `Order #${order.id.slice(-8).toUpperCase()}`,
        link: `/orders/${order.id}`,
      }).catch(() => {});
    }

    res.json({ success: true, order });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
