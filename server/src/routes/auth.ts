import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, eq, and, gt, users, otpCodes, passwordResets, wallets } from "../db";
import { signToken, authMiddleware } from "../lib/auth";
import { sendOTPEmail, sendPasswordResetEmail } from "../lib/mailer";
import crypto from "crypto";

const router = Router();

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "").trim();
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

function phoneToEmail(phone: string): string {
  const normalized = normalizePhone(phone);
  return `${normalized.replace(/\+/g, "p")}@phone.local`;
}

function generateOTP(length = 6): string {
  let otp = "";
  for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
  return otp;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/auth/register", async (req, res) => {
  try {
    const { name, phone, password, confirmPassword, lang = "ar" } = req.body;
    if (!phone || !password) {
      res.status(400).json({ error: lang === "ar" ? "رقم الهاتف وكلمة المرور مطلوبان" : "Phone and password required" });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const existing = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);
    if (existing[0]?.passwordHash) {
      res.status(400).json({ error: lang === "ar" ? "رقم الهاتف مسجل مسبقاً" : "Phone already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const syntheticEmail = phoneToEmail(normalizedPhone);

    let userId: string;
    if (existing[0]) {
      await db.update(users).set({
        passwordHash,
        emailVerified: new Date(),
        name: name || existing[0].name,
        phone: normalizedPhone,
        updatedAt: new Date(),
      }).where(eq(users.id, existing[0].id));
      userId = existing[0].id;
    } else {
      const [newUser] = await db.insert(users).values({
        email: syntheticEmail,
        passwordHash,
        emailVerified: new Date(),
        name: name || null,
        phone: normalizedPhone,
      }).returning();
      userId = newUser.id;
    }

    const walletExists = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (!walletExists[0]) {
      await db.insert(wallets).values({ userId, balance: 0 });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const token = signToken({ id: userId, email: user[0].email, role: user[0].role });
    res.json({
      success: true,
      token,
      user: { id: userId, email: user[0].email, role: user[0].role, name: user[0].name, phone: user[0].phone },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, password, confirmPassword, name, phone, lang = "ar" } = req.body;

    if (!email || !otp || !password) {
      res.status(400).json({ error: lang === "ar" ? "جميع الحقول مطلوبة" : "All fields required" }); return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match" }); return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.email, normalizedEmail),
        eq(otpCodes.code, otp.trim()),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date())
      )
    ).limit(1);

    if (!record[0]) {
      res.status(400).json({ error: lang === "ar" ? "الكود غير صالح أو منتهي الصلاحية" : "Invalid or expired code" }); return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    let userId: string;
    if (existing[0]) {
      await db.update(users).set({
        passwordHash, emailVerified: new Date(),
        ...(name && { name }),
        ...(phone && { phone }),
        updatedAt: new Date(),
      }).where(eq(users.id, existing[0].id));
      userId = existing[0].id;
    } else {
      const [newUser] = await db.insert(users).values({
        email: normalizedEmail, passwordHash, emailVerified: new Date(),
        ...(name && { name }),
        ...(phone && { phone }),
      }).returning();
      userId = newUser.id;
    }

    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, record[0].id));

    const walletExists = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (!walletExists[0]) {
      await db.insert(wallets).values({ userId, balance: 0 });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const token = signToken({ id: userId, email: normalizedEmail, role: user[0].role });
    res.json({
      success: true, token,
      user: { id: userId, email: normalizedEmail, role: user[0].role, name: user[0].name, phone: user[0].phone }
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { phone, password, lang = "ar" } = req.body;
    if (!phone || !password) {
      res.status(400).json({ error: lang === "ar" ? "رقم الهاتف وكلمة المرور مطلوبان" : "Phone and password required" });
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const user = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);

    if (!user[0] || !user[0].passwordHash) {
      res.status(401).json({ error: lang === "ar" ? "بيانات غير صحيحة" : "Invalid credentials" });
      return;
    }
    if (user[0].isBanned) { res.status(403).json({ error: "BANNED" }); return; }

    const valid = await bcrypt.compare(password, user[0].passwordHash);
    if (!valid) {
      res.status(401).json({ error: lang === "ar" ? "بيانات غير صحيحة" : "Invalid credentials" });
      return;
    }

    const token = signToken({ id: user[0].id, email: user[0].email, role: user[0].role });
    res.json({
      token,
      user: { id: user[0].id, email: user[0].email, name: user[0].name, avatar: user[0].avatar, role: user[0].role, phone: user[0].phone }
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email, lang = "ar" } = req.body;
    const user = await db.select().from(users).where(eq(users.email, email?.toLowerCase().trim())).limit(1);
    if (!user[0]?.emailVerified) { res.json({ success: true }); return; }

    await db.delete(passwordResets).where(eq(passwordResets.userId, user[0].id));
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await db.insert(passwordResets).values({ userId: user[0].id, token, expiresAt });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email.toLowerCase().trim(), resetLink, lang);
      req.log.info({ email: email.toLowerCase() }, "Password reset email sent");
    } catch (emailErr) {
      req.log.error({ err: emailErr, resetLink }, "Failed to send password reset email");
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    const reset = await db.select().from(passwordResets).where(eq(passwordResets.token, token)).limit(1);
    if (!reset[0] || reset[0].used || reset[0].expiresAt < new Date()) {
      res.status(400).json({ error: "الرابط غير صالح أو منتهي الصلاحية" }); return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, reset[0].userId));
    await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, reset[0].id));

    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/auth/me", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await db.select({
      id: users.id, email: users.email, name: users.name, avatar: users.avatar,
      role: users.role, phone: users.phone, address: users.address, language: users.language
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ user: user[0] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/auth/profile", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, phone, address, avatar } = req.body;
    await db.update(users).set({
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(avatar !== undefined && { avatar }),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
