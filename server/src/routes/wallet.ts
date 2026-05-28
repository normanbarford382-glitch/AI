import { Router } from "express";
import { db, eq, desc, and, asc, wallets, walletTransactions, walletTopupRequests, paymentMethods, siteSettings } from "../db";
import { authMiddleware } from "../lib/auth";
import { walletEnabledFromMap, parseSettingBool } from "../lib/siteSettings";

const router = Router();

async function fetchWalletEnabled(): Promise<boolean> {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "walletEnabled")).limit(1);
  if (rows[0]) return parseSettingBool(rows[0].value);
  const all = await db.select().from(siteSettings);
  const map: Record<string, string> = {};
  for (const row of all) map[row.key] = row.value ?? "";
  return walletEnabledFromMap(map);
}

router.get("/wallet", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const [walletRows, walletEnabled] = await Promise.all([
      db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1),
      fetchWalletEnabled(),
    ]);

    const wallet = walletRows[0] ?? null;
    const walletId = wallet?.id;

    const [transactions, topupRequests] = await Promise.all([
      walletId
        ? db.select().from(walletTransactions)
            .where(eq(walletTransactions.walletId, walletId))
            .orderBy(desc(walletTransactions.createdAt))
            .limit(20)
        : Promise.resolve([]),
      db.select().from(walletTopupRequests)
        .leftJoin(paymentMethods, eq(walletTopupRequests.paymentMethodId, paymentMethods.id))
        .where(eq(walletTopupRequests.userId, userId))
        .orderBy(desc(walletTopupRequests.createdAt))
        .limit(10),
    ]);

    res.json({ wallet, transactions, topupRequests, walletEnabled });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/wallet/topup", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const lang = req.body.lang || "ar";
    const { paymentMethodId, amount, transactionRef, proofUrl } = req.body;

    const enabled = await fetchWalletEnabled();
    if (!enabled) {
      res.status(400).json({ error: lang === "ar" ? "المحفظة غير مفعّلة حالياً" : "Wallet is not enabled" });
      return;
    }

    const parsedAmount = Number(amount);
    if (!paymentMethodId || !parsedAmount || parsedAmount <= 0) {
      res.status(400).json({ error: lang === "ar" ? "يرجى إدخال المبلغ وطريقة الشحن" : "Amount and payment method are required" });
      return;
    }

    const ref = typeof transactionRef === "string" ? transactionRef.trim() : "";
    const proof = typeof proofUrl === "string" ? proofUrl.trim() : "";
    if (!ref && !proof) {
      res.status(400).json({
        error: lang === "ar"
          ? "يرجى رفع صورة التحويل أو إدخال رقم العملية"
          : "Please upload a transfer screenshot or enter a transaction reference",
      });
      return;
    }

    const method = await db.select().from(paymentMethods)
      .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.isActive, true)))
      .limit(1);
    if (!method[0]) {
      res.status(400).json({ error: lang === "ar" ? "طريقة الشحن غير متاحة" : "Recharge method is not available" });
      return;
    }

    const [topup] = await db.insert(walletTopupRequests).values({
      userId,
      paymentMethodId,
      amount: parsedAmount,
      transactionRef: ref || null,
      proofUrl: proof || null,
    }).returning();

    res.status(201).json({ topup });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/payment-methods", async (req, res) => {
  try {
    const methods = await db.select().from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(asc(paymentMethods.sortOrder));
    res.json({ paymentMethods: methods });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
