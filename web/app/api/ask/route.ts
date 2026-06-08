import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import restaurants from "@/data/scored.json";
import type { Restaurant } from "@/lib/types";
import { apiLog, apiError } from "@/lib/logger";
import { ok, fail } from "@/lib/response";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

// detect provider จาก key prefix → AI SDK model (รองรับ Claude / OpenAI / Gemini)
//   Claude sk-ant-… · OpenAI sk-… · Gemini AIza…
function resolveModel(key: string) {
  if (key.startsWith("sk-ant-")) return { provider: "claude", model: createAnthropic({ apiKey: key })("claude-haiku-4-5-20251001") };
  if (key.startsWith("AIza")) return { provider: "gemini", model: createGoogleGenerativeAI({ apiKey: key })("gemini-2.5-flash") };
  if (key.startsWith("sk-")) return { provider: "openai", model: createOpenAI({ apiKey: key })("gpt-5-mini") };
  return null;
}

// POST /api/ask { question, apiKey } → { data: { answer, provider } } | { error }
//   key จาก user (Claude/OpenAI/Gemini) หรือ fallback server Claude (demo) · rate limit 20/นาที/IP · ไม่ log key/question
export async function POST(req: Request) {
  const t0 = Date.now();
  if (!rateLimit(clientIp(req), 20, 60_000).ok) return fail("เรียกถี่เกินไป ลองใหม่อีกครู่ (จำกัด 20 ครั้ง/นาที)", 429);

  const { question, apiKey } = await req.json().catch(() => ({}));
  if (!question) return fail("no question", 400);

  const key = (apiKey || process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) return fail("ใส่ API key (Claude / OpenAI / Gemini) ในช่องด้านบนก่อนถาม", 401);
  const resolved = resolveModel(key);
  if (!resolved) return fail("รูปแบบ key ไม่รู้จัก — รองรับ Claude (sk-ant-…), OpenAI (sk-…), Gemini (AIza…)", 400);

  const compact = (restaurants as Restaurant[]).map((r) => ({
    name: r.name, area: r.area, cat: r.category, rating: r.rating, reviews: r.reviews,
    price: r.price_text, dist: r.distance_m, total: r.total,
  }));
  const system =
    "คุณเป็นผู้ช่วยแนะนำร้านอาหารมื้อทีม 8-12 คน ใน 5 ย่านกรุงเทพ (สยาม/อารีย์/ทองหล่อ/อโศก/พร้อมพงษ์). ตอบสั้นกระชับเป็นภาษาไทย " +
    "แนะนำร้านจากข้อมูลที่ให้เท่านั้น พร้อมเหตุผลและตัวเลข (เรตติ้ง/รีวิว/ราคา/ระยะ). " +
    "ข้อมูลร้าน (JSON): " + JSON.stringify(compact);

  try {
    const { text } = await generateText({ model: resolved.model, system, prompt: question, maxOutputTokens: 1024 });
    apiLog("/api/ask", { provider: resolved.provider, qlen: question.length, ms: Date.now() - t0 });
    return ok({ answer: text || "ไม่มีคำตอบ", provider: resolved.provider });
  } catch (e) {
    apiError("/api/ask", e);
    return fail("ถาม AI ไม่สำเร็จ: " + (e as Error).message.slice(0, 160), 500);
  }
}
