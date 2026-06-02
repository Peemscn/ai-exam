// scrape-apify.mjs — เก็บข้อมูลร้าน 5 พื้นที่ผ่าน Apify Google Maps Scraper
//   actor: compass/crawler-google-places · ตรงโจทย์ Tech Stack (Apify) · data เต็ม + reliable
// รัน: bun --env-file=.env scripts/scrape-apify.mjs   → data/raw_maps.json
import { writeFileSync } from "fs";

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) {
  console.error("✗ ตั้ง APIFY_TOKEN ใน .env ก่อน");
  process.exit(1);
}

const AREAS = [
  { name: "สยาม", q: "restaurants near Siam BTS Bangkok", lat: 13.7459, lon: 100.534 },
  { name: "อารีย์", q: "restaurants near Ari BTS Bangkok", lat: 13.7798, lon: 100.544 },
  { name: "ทองหล่อ", q: "restaurants near Thong Lor BTS Bangkok", lat: 13.7376, lon: 100.58 },
  { name: "อโศก", q: "restaurants near Asok BTS Bangkok", lat: 13.7383, lon: 100.5614 },
  { name: "พร้อมพงษ์", q: "restaurants near Phrom Phong BTS Bangkok", lat: 13.7305, lon: 100.5697 },
];
const nearest = (lat, lon) =>
  AREAS.reduce((b, a) => ((a.lat - lat) ** 2 + (a.lon - lon) ** 2 < (b.lat - lat) ** 2 + (b.lon - lon) ** 2 ? a : b)).name;

const input = {
  searchStringsArray: AREAS.map((a) => a.q),
  maxCrawledPlacesPerSearch: 60,
  language: "th",
  skipClosedPlaces: false,
};

console.log("Apify Google Maps Scraper — run (5 searches)…");
const res = await fetch(`https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${TOKEN}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(input),
});
if (!res.ok) {
  console.error("Apify error", res.status, (await res.text()).slice(0, 200));
  process.exit(1);
}
const items = await res.json();
console.log("Apify dataset items:", items.length);

// map Apify → rec format (clean.py รับ lat/lon/address/hours/website ตรง)
const maps = items
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
      lat,
      lon,
      address: it.address ?? null,
      hours: (it.openingHours || []).map((h) => (typeof h === "string" ? h : `${h.day || ""} ${h.hours || ""}`.trim())).filter(Boolean).join(" · ") || null,
      website: it.website ?? null,
      url: it.url ?? it.placeId ?? it.title,
      meta: [it.categoryName, it.address].filter(Boolean),
      source: "apify",
    };
  });

writeFileSync("data/raw_maps.json", JSON.stringify(maps, null, 1));
const byArea = maps.reduce((o, m) => ((o[m.area] = (o[m.area] || 0) + 1), o), {});
console.log(`raw_maps.json: ${maps.length} ร้าน (Apify) · พื้นที่:`, JSON.stringify(byArea));
