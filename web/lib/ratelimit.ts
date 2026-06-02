// In-memory token bucket per IP (ต่อ serverless instance)
// หมายเหตุ: serverless = per-instance ไม่ shared — เหมาะ demo/กัน abuse เบื้องต้น
//          production จริงควรใช้ Upstash/Redis (distributed)
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 20, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.reset) {
    buckets.set(ip, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (b.count >= limit) return { ok: false, remaining: 0 };
  b.count++;
  return { ok: true, remaining: limit - b.count };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
