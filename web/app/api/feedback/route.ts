import fbRaw from "@/data/feedback.json";
import type { Feedback } from "@/lib/types";
import { getDb, hasRemoteDb } from "@/lib/db";
import { apiLog, apiError } from "@/lib/logger";
import { ok } from "@/lib/response";

export const runtime = "nodejs";

const AGG_COLS = ["category", "sentiment", "priority", "suggested_owner"];

// GET /api/feedback
//   ?by=col  → aggregate  → { data: groups, meta: { by, source } }
//   else     → list (pagination) → { data: rows, meta: { total, page, pages, source } }
export async function GET(req: Request) {
  const t0 = Date.now();
  const sp = new URL(req.url).searchParams;
  const mode = sp.get("by") ? "aggregate" : "list";

  if (mode === "aggregate") {
    const col = AGG_COLS.includes(sp.get("by") || "") ? sp.get("by")! : "category";
    if (hasRemoteDb()) {
      try {
        const db = getDb();
        const r = await db.execute(`SELECT ${col} AS label, COUNT(*) AS n FROM feedback GROUP BY ${col} ORDER BY n DESC`);
        apiLog("/api/feedback", { mode, by: col, ms: Date.now() - t0, source: "turso" });
        return ok(r.rows, { by: col, source: "turso" });
      } catch (e) {
        apiError("/api/feedback", e);
      }
    }
    const fb = fbRaw as Feedback[];
    const counts: Record<string, number> = {};
    for (const f of fb) { const k = String((f as unknown as Record<string, string>)[col] ?? "—"); counts[k] = (counts[k] || 0) + 1; }
    const groups = Object.entries(counts).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
    apiLog("/api/feedback", { mode, by: col, ms: Date.now() - t0, source: "json" });
    return ok(groups, { by: col, source: "json", total: fb.length });
  }

  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "15", 10)));
  const q = (sp.get("q") || "").trim();
  const category = sp.get("category") || "";
  const sentiment = sp.get("sentiment") || "";
  const priority = sp.get("priority") || "";
  const offset = (page - 1) * limit;

  if (hasRemoteDb()) {
    try {
      const db = getDb();
      const conds: string[] = [];
      const args: (string | number)[] = [];
      if (q) { conds.push("(ai_summary LIKE ? OR matched_theme LIKE ? OR feedback_id LIKE ?)"); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
      if (category) { conds.push("category = ?"); args.push(category); }
      if (sentiment) { conds.push("sentiment = ?"); args.push(sentiment); }
      if (priority) { conds.push("priority = ?"); args.push(priority); }
      const where = conds.length ? "WHERE " + conds.join(" AND ") : "";
      const totalR = await db.execute({ sql: `SELECT COUNT(*) AS n FROM feedback ${where}`, args });
      const total = Number(totalR.rows[0].n);
      const r = await db.execute({ sql: `SELECT * FROM feedback ${where} ORDER BY feedback_id LIMIT ? OFFSET ?`, args: [...args, limit, offset] });
      apiLog("/api/feedback", { mode, page, limit, q, total, ms: Date.now() - t0, source: "turso" });
      return ok(r.rows, { total, page, pages: Math.ceil(total / limit), source: "turso" });
    } catch (e) {
      apiError("/api/feedback", e);
    }
  }

  let list = fbRaw as Feedback[];
  if (q) { const t = q.toLowerCase(); list = list.filter((f) => f.ai_summary.toLowerCase().includes(t) || f.matched_theme.toLowerCase().includes(t) || f.feedback_id.toLowerCase().includes(t)); }
  if (category) list = list.filter((f) => f.category === category);
  if (sentiment) list = list.filter((f) => f.sentiment === sentiment);
  if (priority) list = list.filter((f) => f.priority === priority);
  const total = list.length;
  const rows = list.slice(offset, offset + limit);
  apiLog("/api/feedback", { mode, page, limit, q, total, ms: Date.now() - t0, source: "json" });
  return ok(rows, { total, page, pages: Math.ceil(total / limit), source: "json" });
}
