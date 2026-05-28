import { Router } from "express";
import { db, eq, and, ilike, or, sql, gte, lte, gt, products, categories } from "../db";

const router = Router();

const INTENT_KEYWORDS: Record<string, string[]> = {
  gaming: ["gaming", "game", "gamer", "ألعاب", "العاب", "جيمينج", "لعب", "فريمات", "fps"],
  study: ["study", "student", "دراسة", "طالب", "مدرسة", "جامعة", "تعليم", "ورد", "اوفيس", "office"],
  design: ["design", "تصميم", "مصمم", "فوتوشوب", "illustrator", "photoshop", "illustrater", "graphic"],
  programming: ["programming", "coding", "developer", "برمجة", "مطور", "كود", "development"],
  video: ["video", "editing", "montage", "مونتاج", "فيديو", "تحرير", "premiere", "بريمير", "aftereffect"],
  battery: ["battery", "بطارية", "استمرارية", "شحن", "يدوم", "طول"],
  performance: ["performance", "fast", "speed", "أداء", "سريع", "قوي", "شغلة", "خفيف"],
};

function extractBudget(message: string): { min?: number; max?: number } {
  const lowerMsg = message.toLowerCase();
  const numbers = message.match(/\d+(?:[,.]?\d+)*/g)
    ?.map(n => parseFloat(n.replace(/,/g, "")))
    .filter(n => n >= 100 && n <= 200000) || [];

  const budgetKeywords = ["دولار", "ريال", "جنيه", "دينار", "$", "usd", "budget", "ميزانية", "بميزانية", "بحدود", "يزيد", "أقل", "أكثر", "بسعر"];
  const hasBudgetHint = budgetKeywords.some(k => lowerMsg.includes(k)) || numbers.length > 0;

  if (hasBudgetHint && numbers.length === 1) return { max: numbers[0] };
  if (hasBudgetHint && numbers.length >= 2) return { min: Math.min(...numbers), max: Math.max(...numbers) };
  return {};
}

async function findRelevantProducts(message: string, limit = 6) {
  const lowerMsg = message.toLowerCase();
  const budget = extractBudget(message);

  const baseConditions = [eq(products.isActive, true), gt(products.stock, 0)];
  if (budget.max) baseConditions.push(lte(products.price, budget.max));
  if (budget.min) baseConditions.push(gte(products.price, budget.min));

  const searchTerms: string[] = [];
  for (const [, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(k => lowerMsg.includes(k))) {
      searchTerms.push(keywords[0], keywords[1] ?? keywords[0]);
    }
  }

  const brandMatches = message.match(/\b(dell|hp|lenovo|asus|apple|acer|msi|samsung|lg|huawei|microsoft|toshiba|sony)\b/gi);

  let rows: any[] = [];

  if (searchTerms.length > 0 || brandMatches) {
    const orConds: any[] = [];

    for (const term of [...new Set(searchTerms)].slice(0, 4)) {
      orConds.push(ilike(products.nameAr, `%${term}%`));
      orConds.push(ilike(products.nameEn, `%${term}%`));
      orConds.push(ilike(products.descriptionAr, `%${term}%`));
      orConds.push(ilike(products.descriptionEn, `%${term}%`));
      orConds.push(sql`${products.tags}::text ilike ${"%" + term + "%"}`);
      orConds.push(sql`${products.specsAr}::text ilike ${"%" + term + "%"}`);
      orConds.push(sql`${products.specsEn}::text ilike ${"%" + term + "%"}`);
    }

    if (brandMatches) {
      for (const brand of brandMatches) {
        orConds.push(ilike(products.brand, `%${brand}%`));
      }
    }

    if (orConds.length > 0) {
      rows = await db.select().from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(...baseConditions, or(...orConds)!))
        .limit(limit);
    }
  }

  if (rows.length < 3) {
    const fallback = await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...baseConditions))
      .limit(limit);

    const existingIds = new Set(rows.map((r: any) => r.products.id));
    for (const r of fallback) {
      if (!existingIds.has(r.products.id)) rows.push(r);
      if (rows.length >= limit) break;
    }
  }

  return rows.slice(0, limit).map((r: any) => ({
    id: r.products.id,
    name: r.products.nameAr || r.products.nameEn,
    nameEn: r.products.nameEn,
    price: r.products.price,
    discountPrice: r.products.discountPrice,
    brand: r.products.brand || "",
    category: r.categories?.nameAr || r.categories?.nameEn || "",
    specs: r.products.specsAr || r.products.specsEn,
    slug: r.products.slug,
    tags: (r.products.tags || []).join(", "),
  }));
}

router.post("/ai-chat", async (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(503).json({ error: "AI service not configured. Please set GROQ_API_KEY." });
    return;
  }

  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "Message required" });
      return;
    }

    const relevantProducts = await findRelevantProducts(message.trim());

    const productsContext =
      relevantProducts.length > 0
        ? `\nالمنتجات المتاحة في المتجر (المطابقة لطلبك):\n` +
          relevantProducts
            .map(
              p =>
                `• ${p.name}${p.brand ? " — " + p.brand : ""} | السعر: ${
                  p.discountPrice
                    ? p.discountPrice + " (مخفض من " + p.price + ")"
                    : p.price
                } | ${p.category ? "الفئة: " + p.category + " | " : ""}الرابط: /products/${p.slug}${p.specs ? " | المواصفات: " + JSON.stringify(p.specs).slice(0, 120) : ""}`
            )
            .join("\n")
        : "\nلا توجد منتجات متاحة تطابق هذا الطلب حاليًا.";

    const systemPrompt = `أنت مساعد ذكاء اصطناعي متخصص في متجر لابتوبات. مهمتك مساعدة العملاء في اختيار اللابتوب المثالي من المنتجات المتوفرة فقط.

قواعد صارمة:
- لا تقترح أي منتج غير موجود في القائمة أدناه
- اذكر أسعار المنتجات بوضوح دائمًا
- عند الإشارة لمنتج أضف رابطه بهذا الشكل الدقيق: [اسم المنتج](/products/SLUG) — استبدل SLUG بالرابط الفعلي
- افهم احتياج العميل: الميزانية / الألعاب / الدراسة / التصميم / البرمجة / المونتاج / البطارية / الأداء
- ردودك عربية واضحة ومرتبة ومختصرة
- إذا لم تجد منتجًا مناسبًا قل ذلك بصدق
- لا تختلق مواصفات أو أسعار غير موجودة
${productsContext}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const groqMessages = [
      ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() },
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...groqMessages],
        stream: true,
        max_tokens: 900,
        temperature: 0.65,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => "");
      res.write(`data: ${JSON.stringify({ error: "AI service error: " + groqRes.status })}\n\n`);
      res.end();
      return;
    }

    const reader = (groqRes.body as any).getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { done: d, value } = await reader.read();
      done = d;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {}
        }
      }
    }

    res.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error" });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
        res.end();
      } catch {}
    }
  }
});

export default router;
