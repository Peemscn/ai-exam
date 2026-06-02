import scoredJson from "@/data/scored.json";
import type { Restaurant } from "@/lib/types";
import { getDb, hasRemoteDb } from "@/lib/db";
import { apiError } from "@/lib/logger";
import type { Row } from "@libsql/client";

// map DB row (flat columns: score_*) → Restaurant (nested scores)
function rowToRestaurant(row: Row): Restaurant {
  return {
    rank: 0,
    name: String(row.name),
    area: String(row.area ?? ""),
    category: String(row.category ?? ""),
    cuisine_osm: (row.cuisine_osm as string | null) ?? null,
    rating: Number(row.rating),
    reviews: Number(row.reviews),
    price_text: String(row.price_text ?? ""),
    price_min: row.price_min as number | null,
    price_max: row.price_max as number | null,
    address: (row.address as string | null) ?? null,
    lat: row.lat as number | null,
    lon: row.lon as number | null,
    distance_m: row.distance_m as number | null,
    hours: (row.hours as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    source_maps: String(row.source_maps ?? ""),
    matched_osm: !!row.matched_osm,
    scores: {
      rating_review: Number(row.score_rating_review),
      group_suitability: Number(row.score_group),
      price_suitability: Number(row.score_price),
      travel_convenience: Number(row.score_travel),
      data_completeness: Number(row.score_data),
      uniqueness: Number(row.score_unique),
    },
    total: Number(row.total),
  };
}

// ดึงร้านทั้งหมดเรียงคะแนน — จาก Turso ถ้ามี (sync กับ re-scrape) · fallback scored.json (build/no-DB)
export async function getScoredRestaurants(): Promise<Restaurant[]> {
  if (hasRemoteDb()) {
    try {
      const db = getDb();
      const r = await db.execute("SELECT * FROM restaurants ORDER BY total DESC, reviews DESC");
      if (r.rows.length) return r.rows.map((row, i) => ({ ...rowToRestaurant(row), rank: i + 1 }));
    } catch (e) {
      apiError("getScoredRestaurants", e); // → fallback JSON
    }
  }
  return [...(scoredJson as Restaurant[])].sort((a, b) => b.total - a.total).map((r, i) => ({ ...r, rank: i + 1 }));
}
