import { runApifyPipeline } from "@/lib/pipeline";
import { apiLog, apiError } from "@/lib/logger";
import { ok, fail } from "@/lib/response";

export const runtime = "nodejs";
export const maxDuration = 300; // Apify run-sync (5 พื้นที่) อาจใช้เวลา 2-4 นาที

// POST /api/scrape → re-scrape สด: Apify REST API → clean + score → update Turso
//   ทำงานเหมือนกันทั้ง local + production (Apify = HTTP API → Vercel serverless เรียกตรงได้
//   ไม่ต้อง chromium/python/CI) · default หน้าเว็บอ่านจาก DB อยู่แล้ว — ปุ่มนี้กดเพื่ออัปเดต DB
//   → { data: { msg, scraped, cleaned, top3 } } | { error }
export async function POST() {
  const t0 = Date.now();
  const token = process.env.APIFY_TOKEN;
  if (!token) return fail("ตั้ง APIFY_TOKEN ก่อน (re-scrape ผ่าน Apify Google Maps Scraper)", 500);
  try {
    const r = await runApifyPipeline(token);
    const sec = Math.round((Date.now() - t0) / 1000);
    apiLog("/api/scrape", { scraped: r.scraped, cleaned: r.cleaned, ms: Date.now() - t0 });
    return ok({
      msg: `re-scrape เสร็จใน ${sec}s — Apify ดึง ${r.scraped} ร้าน → clean ${r.cleaned} ร้าน → อัปเดต Turso แล้ว (รีเฟรชดูข้อมูลใหม่)`,
      scraped: r.scraped,
      cleaned: r.cleaned,
      top3: r.top3,
    });
  } catch (e) {
    apiError("/api/scrape", e);
    return fail("re-scrape ล้มเหลว: " + (e as Error).message.slice(0, 180), 500);
  }
}
