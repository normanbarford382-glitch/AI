import { Router } from "express";
import { db, eq, desc, conversations, messages, users } from "../db";
import { authMiddleware, adminOnly } from "../lib/auth";

const router = Router();

// Get user's conversation (creates one if not exists)
router.get("/chat", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    let conv = await db.select().from(conversations).where(eq(conversations.userId, userId)).limit(1);

    if (!conv[0]) {
      const [newConv] = await db.insert(conversations).values({ userId }).returning();
      conv = [newConv];
    }

    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, conv[0].id))
      .orderBy(messages.createdAt);

    res.json({ conversation: { ...conv[0], messages: msgs } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Send a message (user or admin)
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const senderId = (req as any).user.id;
    const role = (req as any).user.role;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);
    const { conversationId, content } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ error: "Message content required" }); return;
    }

    let convId = conversationId;

    if (!isAdmin) {
      // User sending: use their own conversation
      let conv = await db.select().from(conversations).where(eq(conversations.userId, senderId)).limit(1);
      if (!conv[0]) {
        const [newConv] = await db.insert(conversations).values({ userId: senderId }).returning();
        conv = [newConv];
      }
      convId = conv[0].id;
    } else if (!convId) {
      res.status(400).json({ error: "conversationId required for admin" }); return;
    }

    const [msg] = await db.insert(messages).values({
      conversationId: convId,
      senderId,
      content: content.trim(),
      isFromAdmin: isAdmin,
    }).returning();

    // Update conversation's last message
    await db.update(conversations).set({
      lastMessage: content.trim(),
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(conversations.id, convId));

    res.json({ message: msg });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: get all conversations
router.get("/admin/chat", authMiddleware, adminOnly, async (req, res) => {
  try {
    const allConvs = await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
    const allUsers = await db.select().from(users);
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

    const convs = await Promise.all(allConvs.map(async (row) => {
      const msgs = await db.select().from(messages)
        .where(eq(messages.conversationId, row.id))
        .orderBy(messages.createdAt)
        .limit(50);
      const u = userMap[row.userId];
      return {
        ...row,
        user: { name: u?.name, email: u?.email || "", avatar: u?.avatar },
        messages: msgs,
      };
    }));

    res.json({ conversations: convs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: get single conversation with messages
router.get("/admin/chat/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = String(req.params.id);
    const convRow = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (!convRow[0]) { res.status(404).json({ error: "Not found" }); return; }

    const convUser = await db.select().from(users).where(eq(users.id, convRow[0].userId)).limit(1);

    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.json({
      conversation: {
        ...convRow[0],
        user: { name: convUser[0]?.name, email: convUser[0]?.email || "", avatar: convUser[0]?.avatar },
        messages: msgs,
      }
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
