// pipeline.ts — scrape (Apify) → clean → score → seed Turso · port จาก python (clean.py/score.py) + scrape-apify.mjs
//   in-memory ทั้งหมด → Vercel serverless เรียก Apify REST API ตรงๆ ได้ (ไม่ต้อง chromium/python/CI)
//   ใช้โดย /api/scrape (local + production เหมือนกัน)
import { getDb } from "@/lib/db";

// 5 พื้นที่ในโจทย์ (ห้ามนอกนี้) + center (BTS/MRT) ใช้คิดระยะเดินทาง
const AREAS = [
  { name: "สยาม", q: "restaurants near Siam BTS Bangkok", lat: 13.7459, lon: 100.534 },
  { name: "อารีย์", q: "restaurants near Ari BTS Bangkok", lat: 13.7798, lon: 100.544 },
  { name: "ทองหล่อ", q: "restaurants near Thong Lor BTS Bangkok", lat: 13.7376, lon: 100.58 },
  { name: "อโศก", q: "restaurants near Asok BTS Bangkok", lat: 13.7383, lon: 100.5614 },
  { name: "พร้อมพงษ์", q: "restaurants near Phrom Phong BTS Bangkok", lat: 13.7305, lon: 100.5697 },
] as const;
const AREA_CENTERS: Record<string, [number, number]> = {
  สยาม: [13.7459, 100.534], อารีย์: [13.7798, 100.544], ทองหล่อ: [13.7376, 100.58],
  อโศก: [13.7383, 100.5614], พร้อมพงษ์: [13.7305, 100.5697],
};
const DEFAULT_CENTER: [number, number] = [13.7383, 100.5614];

const nearest = (lat: number, lon: number) =>
  AREAS.reduce((b, a) =>
    (a.lat - lat) ** 2 + (a.lon - lon) ** 2 < (b.lat - lat) ** 2 + (b.lon - lon) ** 2 ? a : b
  ).name;

export type RawPlace = {
  name: string; rating: number | null; reviews: number | null; price: string | null;
  category: string; area: string; lat: number | null; lon: number | null;
  address: string | null; hours: string | null; website: string | null; url: string;
};

// ---- 1) scrape ผ่าน Apify Google Maps Scraper (REST API) ----
//   actor compass/crawler-google-places · run-sync = block จนเสร็จ → คืน dataset items
export async function scrapeApify(token: string): Promise<RawPlace[]> {
  const input = {
    searchStringsArray: AREAS.map((a) => a.q),
    maxCrawledPlacesPerSearch: 60,
    language: "th",
    skipClosedPlaces: false,
  };
  const res = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${token}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }
  );
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const items = (await res.json()) as Record<string, any>[];
  return items
    .filter((it) => it.title && it.totalScore)
    .map((it) => {
      const lat = it.location?.lat ?? null;
      const lon = it.location?.lng ?? null;
      return {
        name: it.title,
        rating: it.totalScore ?? null,
        reviews: it.reviewsCount ?? null,
        price: it.price ?? null,
        category: it.categoryName || "",
        area: lat != null ? nearest(lat, lon) : "อโศก",
        lat, lon,
        address: it.address ?? null,
        hours:
          (it.openingHours || [])
            .map((h: any) => (typeof h === "string" ? h : `${h.day || ""} ${h.hours || ""}`.trim()))
            .filter(Boolean)
            .join(" · ") || null,
        website: it.website ?? null,
        url: it.url ?? it.placeId ?? it.title,
      };
    });
}

// ---- 2) clean (port clean.py — in-memory · ไม่ merge OSM เพราะ Apify ให้ address/hours/website/lat ครบ) ----
const norm = (s: string) => (s || "").toLowerCase().replace(/[\s\-_.()&,]+/g, "");

function parsePrice(p: string | null): [number | null, number | null] {
  if (!p) return [null, null];
  const nums = (p.match(/[\d,]+/g) || []).map((x) => parseInt(x.replace(/,/g, ""), 10));
  if (!nums.length) return [null, null];
  if (p.includes("+")) return [nums[0], null];
  if (nums.length >= 2) return [nums[0], nums[1]];
  return [nums[0], nums[0]];
}

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000, rad = (d: number) => (d * Math.PI) / 180;
  const p1 = rad(a[0]), p2 = rad(b[0]), dlat = rad(b[0] - a[0]), dlon = rad(b[1] - a[1]);
  const x = Math.sin(dlat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlon / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(x)));
}

export type CleanPlace = Omit<RawPlace, "category"> & {
  category: string; cuisine_osm: string | null;
  price_text: string | null; price_min: number | null; price_max: number | null;
  distance_m: number | null; source_maps: string; matched_osm: boolean;
};

export function clean(maps: RawPlace[]): CleanPlace[] {
  const out: CleanPlace[] = [];
  for (const m of maps) {
    if (!(m.rating && m.reviews)) continue; // ต้องมี rating + reviews (price optional)
    const area = m.area || "อโศก";
    const center = AREA_CENTERS[area] || DEFAULT_CENTER;
    const [pmin, pmax] = parsePrice(m.price);
    const { lat, lon } = m;
    out.push({
      ...m,
      name: m.name.trim(),
      area,
      category: m.category || "ร้านอาหาร",
      cuisine_osm: null,
      price_text: m.price,
      price_min: pmin,
      price_max: pmax,
      address: m.address ?? null,
      lat, lon,
      distance_m: lat != null && lon != null ? haversine(center, [lat, lon]) : null,
      hours: m.hours ?? null,
      website: m.website ?? null,
      source_maps: m.url,
      matched_osm: false,
    });
  }
  // dedupe by name (keep most reviews) — substring match ทั้งสองทาง, len ≥ 6
  out.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  const kept: CleanPlace[] = [];
  for (const c of out) {
    const nk = norm(c.name);
    const dup = kept.some((k) => {
      const kn = norm(k.name);
      return (nk.includes(kn) || kn.includes(nk)) && Math.min(nk.length, kn.length) >= 6;
    });
    if (!dup) kept.push(c);
  }
  return kept;
}

// ---- 3) scoring (port score.py — 100 คะแนน, deterministic) ----
const GROUP_GOOD = ["ภัตตาคาร","ปิ้งย่าง","ยากินิกุ","บุฟเฟ","อาหารทะเล","สเต็ก","ไทย","อิตาลี","อินเดีย","จีน","ร้านอาหาร","บาร์","ห้องอาหาร","เลบานอน","ตะวันตก","เม็กซิ","ราเมน","อิซาคายะ","ชาบู","เกาหลี"];
const GROUP_WEAK = ["คาเฟ่","กาแฟ","เบเกอรี","ขนม","จานด่วน","แซนด์วิช","ก๋วยเตี๋ยว","ศูนย์อาหาร","ไอศกรีม","แฮมเบอร์เกอร์","พิซซ่า"];
const UNIQUE_KW = ["rooftop","บาร์","ปิ้งย่าง","ยากินิกุ","เลบานอน","เม็กซิ","อินเดีย","ราเมน","สเต็ก","อิซาคายะ","หูฉลาม","ทะเล","เกาหลี","บิสโทร"];
const r1 = (n: number) => Math.round(n * 10) / 10;

export type Scores = {
  rating_review: number; group_suitability: number; price_suitability: number;
  travel_convenience: number; data_completeness: number; uniqueness: number;
};
export type ScoredPlace = CleanPlace & { scores: Scores; total: number; rank: number };

export function score(cleaned: CleanPlace[]): ScoredPlace[] {
  const sRatingReview = (r: CleanPlace) => {
    const rr = Math.max(0, (r.rating! - 3.5) / 1.5) * 15;             // /15 คุณภาพ rating
    const rv = Math.min(10, (Math.log10(r.reviews! + 1) / Math.log10(25000)) * 10); // /10 ความน่าเชื่อ
    return r1(Math.min(25, rr + rv));
  };
  const sGroup = (r: CleanPlace) => {
    const c = r.category || "";
    let base = 10;
    if (GROUP_GOOD.some((g) => c.includes(g))) base = 16;
    if (GROUP_WEAK.some((w) => c.includes(w))) base = 7;
    return r1(Math.min(20, base + Math.min(4, r.reviews! / 2500)));
  };
  const sPrice = (r: CleanPlace) => {
    const lo = r.price_min, hi = r.price_max;
    if (lo == null) return 7;
    const mid = (lo + (hi ?? lo)) / 2;
    if (mid >= 200 && mid <= 700) return 15;
    if (mid < 200) return 10;
    if (mid <= 1200) return 12;
    if (mid <= 2000) return 8;
    return 5;
  };
  const sTravel = (r: CleanPlace) => {
    const d = r.distance_m;
    if (d == null) return 7;
    return d <= 300 ? 15 : d <= 600 ? 12 : d <= 900 ? 9 : d <= 1200 ? 6 : 3;
  };
  const sData = (r: CleanPlace) => {
    const fields = [r.address, r.hours, r.website, r.cuisine_osm, r.lat, r.category];
    return r1((fields.filter(Boolean).length / fields.length) * 15);
  };
  const sUnique = (r: CleanPlace) => {
    const c = (r.category || "").toLowerCase();
    let sc = 4;
    if (r.rating! >= 4.7) sc += 3;
    if (UNIQUE_KW.some((k) => c.includes(k))) sc += 3;
    return Math.min(10, sc);
  };

  const scored = cleaned.map((r) => {
    const scores: Scores = {
      rating_review: sRatingReview(r),
      group_suitability: sGroup(r),
      price_suitability: sPrice(r),
      travel_convenience: sTravel(r),
      data_completeness: sData(r),
      uniqueness: sUnique(r),
    };
    const total = r1(Object.values(scores).reduce((a, b) => a + b, 0));
    return { ...r, scores, total, rank: 0 } as ScoredPlace;
  });
  scored.sort((a, b) => b.total - a.total || (b.reviews || 0) - (a.reviews || 0));
  scored.forEach((r, i) => (r.rank = i + 1));
  return scored;
}

// ---- 4) seed Turso (port seed.mjs · restaurants — batch = 1 round-trip, atomic) ----
const RCOLS = "name,area,category,cuisine_osm,rating,reviews,price_text,price_min,price_max,address,lat,lon,distance_m,hours,website,source_maps,matched_osm,score_rating_review,score_group,score_price,score_travel,score_data,score_unique,total,rank";

export async function seedRestaurants(scored: ScoredPlace[]) {
  const db = getDb();
  const sql = `INSERT INTO restaurants (${RCOLS}) VALUES (${Array(25).fill("?").join(",")})`;
  const rows = scored.map((r) => {
    const s = r.scores;
    return {
      sql,
      args: [
        r.name, r.area, r.category, r.cuisine_osm, r.rating, r.reviews,
        r.price_text, r.price_min, r.price_max, r.address, r.lat, r.lon,
        r.distance_m, r.hours, r.website, r.source_maps, r.matched_osm ? 1 : 0,
        s.rating_review, s.group_suitability, s.price_suitability,
        s.travel_convenience, s.data_completeness, s.uniqueness, r.total, r.rank,
      ] as (string | number | null)[],
    };
  });
  await db.batch([
    { sql: "DELETE FROM restaurants", args: [] },
    ...rows,
    { sql: "INSERT INTO scrape_runs (source, count, note) VALUES (?, ?, ?)", args: ["apify", scored.length, "re-scrape via /api/scrape (Apify REST)"] },
  ]);
}

// ---- pipeline เต็ม: Apify → clean → score → seed ----
export async function runApifyPipeline(token: string) {
  const raw = await scrapeApify(token);
  const cleaned = clean(raw);
  const scored = score(cleaned);
  await seedRestaurants(scored);
  return {
    scraped: raw.length,
    cleaned: cleaned.length,
    top3: scored.slice(0, 3).map((r) => ({ name: r.name, area: r.area, total: r.total })),
  };
}
