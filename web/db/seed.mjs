// seed.mjs — สร้าง schema + seed restaurants (q3) + feedback (q1) ลง Turso
// รัน: node --env-file=.env.local db/seed.mjs   (จาก web/)
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("✗ ตั้ง TURSO_DATABASE_URL + TURSO_AUTH_TOKEN ก่อน (ใน .env.local)");
  process.exit(1);
}
const db = createClient({ url, authToken });

// 1) schema
const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
  await db.execute(stmt);
}
console.log("✓ schema created");

// 2) seed restaurants (q3) จาก scored.json
const rs = JSON.parse(readFileSync(new URL("../data/scored.json", import.meta.url), "utf8"));
await db.execute("DELETE FROM restaurants");
const rcols =
  "name,area,category,cuisine_osm,rating,reviews,price_text,price_min,price_max,address,lat,lon,distance_m,hours,website,source_maps,matched_osm,score_rating_review,score_group,score_price,score_travel,score_data,score_unique,total,rank";
const rsql = `INSERT INTO restaurants (${rcols}) VALUES (${Array(25).fill("?").join(",")})`;
for (const r of rs) {
  const s = r.scores;
  await db.execute({
    sql: rsql,
    args: [
      r.name, r.area, r.category, r.cuisine_osm, r.rating, r.reviews,
      r.price_text, r.price_min, r.price_max, r.address, r.lat, r.lon,
      r.distance_m, r.hours, r.website, r.source_maps, r.matched_osm ? 1 : 0,
      s.rating_review, s.group_suitability, s.price_suitability,
      s.travel_convenience, s.data_completeness, s.uniqueness, r.total, r.rank,
    ],
  });
}
console.log(`✓ seeded ${rs.length} restaurants`);

// 3) seed feedback (q1) จาก feedback.json
const fb = JSON.parse(readFileSync(new URL("../data/feedback.json", import.meta.url), "utf8"));
await db.execute("DELETE FROM feedback");
const fsql =
  "INSERT INTO feedback (feedback_id,sentiment,category,priority,suggested_owner,confidence,matched_theme,ai_summary) VALUES (?,?,?,?,?,?,?,?)";
for (const f of fb) {
  await db.execute({
    sql: fsql,
    args: [f.feedback_id, f.sentiment, f.category, f.priority, f.suggested_owner, f.confidence, f.matched_theme, f.ai_summary],
  });
}
console.log(`✓ seeded ${fb.length} feedback`);

await db.execute({
  sql: "INSERT INTO scrape_runs (source, count, note) VALUES (?, ?, ?)",
  args: ["seed", rs.length, "initial seed from scored.json"],
});
console.log("✓ done");
process.exit(0);
