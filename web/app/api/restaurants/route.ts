import data from "@/data/scored.json";
import type { Restaurant } from "@/lib/types";
import { getDb, hasRemoteDb } from "@/lib/db";
import { apiLog, apiError } from "@/lib/logger";
import { ok } from "@/lib/response";

export const runtime = "nodejs";

const SORT_SQL: Record<string, string> = {
  total: "total DESC", rating: "rating DESC", dist: "distance_m ASC", reviews: "reviews DESC",
};
const SORT_FN: Record<string, (a: Restaurant, b: Restaurant) => number> = {
  total: (a, b) => b.total - a.total,
  rating: (a, b) => b.rating - a.rating,
  dist: (a, b) => (a.distance_m ?? 1e9) - (b.distance_m ?? 1e9),
  reviews: (a, b) => b.reviews - a.reviews,
};

// GET /api/restaurants?page&limit&q&sort&area → { data: rows, meta: { total, page, pages, source } }
export async function GET(req: Request) {
  const t0 = Date.now();
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(500, Math.max(1, parseInt(sp.get("limit") || "10", 10)));
  const q = (sp.get("q") || "").trim();
  const area = (sp.get("area") || "").trim();
  const sortKey = sp.get("sort") || "total";
  const offset = (page - 1) * limit;

  if (hasRemoteDb()) {
    try {
      const db = getDb();
      const conds: string[] = [];
      const wargs: (string | number)[] = [];
      if (q) { conds.push("(name LIKE ? OR category LIKE ? OR address LIKE ?)"); wargs.push(`%${q}%`, `%${q}%`, `%${q}%`); }
      if (area) { conds.push("area = ?"); wargs.push(area); }
      const where = conds.length ? "WHERE " + conds.join(" AND ") : "";
      const totalR = await db.execute({ sql: `SELECT COUNT(*) AS n FROM restaurants ${where}`, args: wargs });
      const total = Number(totalR.rows[0].n);
      const order = SORT_SQL[sortKey] || SORT_SQL.total;
      const r = await db.execute({ sql: `SELECT * FROM restaurants ${where} ORDER BY ${order} LIMIT ? OFFSET ?`, args: [...wargs, limit, offset] });
      apiLog("/api/restaurants", { page, limit, q, area, sort: sortKey, total, ms: Date.now() - t0, source: "turso" });
      return ok(r.rows, { total, page, pages: Math.ceil(total / limit), source: "turso" });
    } catch (e) {
      apiError("/api/restaurants", e);
    }
  }

  let list = [...(data as Restaurant[])];
  if (q) { const t = q.toLowerCase(); list = list.filter((r) => r.name.toLowerCase().includes(t) || (r.category || "").toLowerCase().includes(t) || (r.address || "").toLowerCase().includes(t)); }
  if (area) list = list.filter((r) => r.area === area);
  list.sort(SORT_FN[sortKey] || SORT_FN.total);
  const total = list.length;
  const rows = list.slice(offset, offset + limit).map((r, i) => ({ ...r, rank: offset + i + 1 }));
  apiLog("/api/restaurants", { page, limit, q, area, sort: sortKey, total, ms: Date.now() - t0, source: "json" });
  return ok(rows, { total, page, pages: Math.ceil(total / limit), source: "json" });
}
