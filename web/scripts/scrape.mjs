// scrape.mjs — เก็บข้อมูลร้าน 5 พื้นที่ในโจทย์ (สยาม/อารีย์/ทองหล่อ/อโศก/พร้อมพงษ์)
//   Google Maps = scrape DOM (tag area) · OSM Overpass = API fetch ต่อ center แต่ละพื้นที่
// ติดตั้ง: npm i && npx playwright install chromium
// รัน:    node scripts/scrape.mjs   (จาก web/)  → data/raw_maps.json + raw_osm.json
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const AREAS = [
  { name: "สยาม", q: "restaurants near Siam BTS Bangkok", lat: 13.7459, lon: 100.534 },
  { name: "อารีย์", q: "restaurants near Ari BTS Bangkok", lat: 13.7798, lon: 100.544 },
  { name: "ทองหล่อ", q: "restaurants near Thong Lor BTS Bangkok", lat: 13.7376, lon: 100.58 },
  { name: "อโศก", q: "restaurants near Asok BTS Bangkok", lat: 13.7383, lon: 100.5614 },
  { name: "พร้อมพงษ์", q: "restaurants near Phrom Phong BTS Bangkok", lat: 13.7305, lon: 100.5697 },
];
const OUT = "data";

// เลียน real browser (headless ปกติโดน Maps ส่ง lite DOM — ขาด reviews/price/aria)
const browser = await chromium.launch({
  args: ["--disable-blink-features=AutomationControlled", "--lang=th-TH"],
});
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1400, height: 900 },
  locale: "th-TH",
});
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});
const page = await context.newPage();
const allMaps = [];
const allOsm = [];

for (const area of AREAS) {
  // ---- Google Maps : scroll feed + extract DOM cards (tag area) ----
  await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(area.q)}`);
  await page.waitForSelector("div.Nv2PK", { timeout: 25000 }).catch(() => {});
  const maps = await page.evaluate(async (areaName) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const feed = document.querySelector('[role="feed"]');
    const map = new Map();
    const grab = () => {
      for (const c of document.querySelectorAll("div.Nv2PK")) {
        const name = (c.querySelector(".qBF1Pd") || {}).textContent;
        if (!name) continue;
        const url = (c.querySelector("a.hfpxzc") || {}).href || name;
        const txt = c.textContent || "";
        // rating+reviews จาก aria-label (โหลดพร้อม card) — text "4.9(1,234)" เป็น lazy ดึงไม่ทันตอน scroll เร็ว
        const ariaEl = c.querySelector('[role="img"][aria-label]') || c.querySelector("span[aria-label]");
        const aria = ariaEl ? ariaEl.getAttribute("aria-label") || "" : "";
        const am = aria.match(/([\d.]+)\s*(?:ดาว|star)[^\d]*([\d,]+)/i); // "4.9 ดาว 3,473 รีวิว"
        const rm = txt.match(/(\d(?:\.\d)?)\s*\(([\d,]+)\)/); // fallback
        const pm = txt.match(/฿[\d,]+(?:[-–][\d,]+)?\+?|฿฿+/);
        const rec = {
          name,
          rating: am ? parseFloat(am[1]) : rm ? parseFloat(rm[1]) : null,
          reviews: am ? parseInt(am[2].replace(/,/g, "")) : rm ? parseInt(rm[2].replace(/,/g, "")) : null,
          price: pm ? pm[0] : null,
          category: "",
          meta: [...c.querySelectorAll(".W4Efsd")].map((e) => e.textContent.trim()).filter(Boolean),
          url,
          area: areaName,
        };
        const old = map.get(url);
        if (!old || (rec.reviews && !old.reviews) || (rec.price && !old.price)) map.set(url, rec);
      }
    };
    await sleep(2200); // รอ card ชุดแรก render (rating/reviews/price เป็น lazy)
    for (let i = 0; i < 16; i++) {
      grab();
      if (feed) feed.scrollTop = feed.scrollHeight;
      await sleep(1700); // ช้าลง — ให้ card render ก่อน scroll ถัดไป
    }
    await sleep(800);
    grab();
    return [...map.values()];
  }, area.name);
  allMaps.push(...maps);
  console.log(`${area.name}: ${maps.length} ร้าน`);

  // ---- OSM Overpass : รอบ center ของพื้นที่ ----
  const osm = await page.evaluate(async (c) => {
    try {
      const q = `[out:json][timeout:25];node[amenity~"^(restaurant|cafe|fast_food)$"][name](around:700,${c.lat},${c.lon});out body;`;
      const r = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(q),
      });
      if (!r.ok) return [];
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("json")) return []; // Overpass ตอบ XML ตอน rate-limit → ข้าม
      const j = await r.json();
      return j.elements
        .map((e) => ({
          name: e.tags.name || null,
          name_en: e.tags["name:en"] || null,
          cuisine: e.tags.cuisine || null,
          hours: e.tags.opening_hours || null,
          website: e.tags.website || e.tags["contact:website"] || null,
          phone: e.tags.phone || e.tags["contact:phone"] || null,
          lat: e.lat,
          lon: e.lon,
        }))
        .filter((x) => x.name);
    } catch {
      return [];
    }
  }, area);
  allOsm.push(...osm);
  await page.waitForTimeout(2500); // delay ระหว่างพื้นที่ (กัน OSM Overpass rate-limit)
}

writeFileSync(`${OUT}/raw_maps.json`, JSON.stringify(allMaps, null, 1));
writeFileSync(`${OUT}/raw_osm.json`, JSON.stringify(allOsm, null, 1));
console.log(`รวม: raw_maps ${allMaps.length} · raw_osm ${allOsm.length} (${AREAS.length} พื้นที่)`);
await browser.close();
