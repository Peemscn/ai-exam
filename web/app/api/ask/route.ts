import restaurants from "@/data/scored.json";
import type { Restaurant } from "@/lib/types";
import { apiLog, apiError } from "@/lib/logger";
import { ok, fail } from "@/lib/response";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

// POST /api/ask { question, apiKey } → { data: { answer } } | { error }
//   key จาก user input (ปกติ) หรือ env · rate limit 20/นาที/IP · ไม่ log key/question
export async function POST(req: Request) {
  const t0 = Date.now();
  if (!rateLimit(clientIp(req), 20, 60_000).ok) return fail("เรียกถี่เกินไป ลองใหม่อีกครู่ (จำกัด 20 ครั้ง/นาที)", 429);

  const { question, apiKey } = await req.json().catch(() => ({}));
  if (!question) return fail("no question", 400);

  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return fail("ใส่ Anthropic API key ในช่องด้านบนก่อนถาม (key ของคุณเอง)", 401);

  const compact = (restaurants as Restaurant[]).map((r) => ({
    name: r.name, area: r.area, cat: r.category, rating: r.rating, reviews: r.reviews,
    price: r.price_text, dist: r.distance_m, total: r.total,
  }));
  const system =
    "คุณเป็นผู้ช่วยแนะนำร้านอาหารมื้อทีม 8-12 คน ใน 5 ย่านกรุงเทพ (สยาม/อารีย์/ทองหล่อ/อโศก/พร้อมพงษ์). ตอบสั้นกระชับเป็นภาษาไทย " +
    "แนะนำร้านจากข้อมูลที่ให้เท่านั้น พร้อมเหตุผลและตัวเลข (เรตติ้ง/รีวิว/ราคา/ระยะ). " +
    "ข้อมูลร้าน (JSON): " + JSON.stringify(compact);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1024, system, messages: [{ role: "user", content: question }] }),
    });
    const j = await r.json();
    apiLog("/api/ask", { qlen: question.length, status: r.status, ms: Date.now() - t0 });
    return ok({ answer: j?.content?.[0]?.text ?? j?.error?.message ?? "ไม่มีคำตอบ" });
  } catch (e) {
    apiError("/api/ask", e);
    return fail((e as Error).message, 500);
  }
}
