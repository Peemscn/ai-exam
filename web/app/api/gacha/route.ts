import { getDb } from "@/lib/db";
import { apiLog, apiError } from "@/lib/logger";
import { ok, fail } from "@/lib/response";

export const runtime = "nodejs";

const ENSURE = `CREATE TABLE IF NOT EXISTS gacha_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  pulls INTEGER, ssr_count INTEGER, sr_count INTEGER, r_count INTEGER,
  ssr_rate REAL, pity INTEGER, spent INTEGER, config TEXT
)`;

// GET /api/gacha → { data: sessions[] }
export async function GET() {
  const t0 = Date.now();
  try {
    const db = getDb();
    await db.execute(ENSURE);
    const r = await db.execute("SELECT * FROM gacha_sessions ORDER BY id DESC LIMIT 10");
    apiLog("/api/gacha", { method: "GET", n: r.rows.length, ms: Date.now() - t0 });
    return ok(r.rows);
  } catch (e) {
    apiError("/api/gacha", e);
    return ok([]); // graceful — sessions ว่าง (ไม่มี DB)
  }
}

// POST /api/gacha → บันทึก Monte Carlo session → { data: { saved: true } }
export async function POST(req: Request) {
  const t0 = Date.now();
  const b = await req.json().catch(() => ({}));
  try {
    const db = getDb();
    await db.execute(ENSURE);
    await db.execute({
      sql: "INSERT INTO gacha_sessions (pulls, ssr_count, sr_count, r_count, ssr_rate, pity, spent, config) VALUES (?,?,?,?,?,?,?,?)",
      args: [b.pulls ?? 0, b.ssr_count ?? 0, b.sr_count ?? 0, b.r_count ?? 0, b.ssr_rate ?? 0, b.pity ?? 0, b.spent ?? 0, b.config ?? ""],
    });
    apiLog("/api/gacha", { method: "POST", pulls: b.pulls, ms: Date.now() - t0 });
    return ok({ saved: true });
  } catch (e) {
    apiError("/api/gacha", e);
    return fail((e as Error).message, 500);
  }
}
