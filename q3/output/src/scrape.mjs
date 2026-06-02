// scrape.mjs — เก็บข้อมูลร้านย่านอโศก (reproduce การ scrape ที่ทำผ่าน Playwright)
//   Google Maps = scrape DOM · OSM Overpass = API fetch (ผ่าน browser context เลี่ยง 406)
// ติดตั้ง: npm i playwright && npx playwright install chromium
// รัน:    node q3/output/src/scrape.mjs   → q3/output/data/raw_maps.json + raw_osm.json
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const SEARCH = "restaurants near Asok Bangkok";
const CENTER = { lat: 13.7383, lon: 100.5614 };   // Asok
const OUT = "q3/output/data";

const browser = await chromium.launch();
const page = await browser.newPage();

// ---- 1) Google Maps : scroll feed + extract DOM cards ----
await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(SEARCH)}`);
await page.waitForSelector("div.Nv2PK", { timeout: 25000 });
const maps = await page.evaluate(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const feed = document.querySelector('[role="feed"]');
  const map = new Map();                                   // incremental: กัน virtual-list recycle
  const grab = () => {
    for (const c of document.querySelectorAll("div.Nv2PK")) {
      const name = (c.querySelector(".qBF1Pd") || {}).textContent; if (!name) continue;
      const url = (c.querySelector("a.hfpxzc") || {}).href || name;
      const txt = c.textContent || "";
      const rm = txt.match(/(\d(?:\.\d)?)\s*\(([\d,]+)\)/);            // "4.8(1,234)"
      const pm = txt.match(/฿[\d,]+(?:[-–][\d,]+)?\+?|฿฿+/);          // "฿200-400"
      const cat = (c.querySelector(".W4Efsd") || {}).textContent || "";
      const rec = { name, rating: rm ? parseFloat(rm[1]) : null,
        reviews: rm ? parseInt(rm[2].replace(/,/g, "")) : null,
        price: pm ? pm[0] : null, category: (cat.split("·")[0] || "").trim(),
        meta: [...c.querySelectorAll(".W4Efsd")].map(e => e.textContent.trim()).filter(Boolean), url };
      const old = map.get(url);
      if (!old || (rec.reviews && !old.reviews) || (rec.price && !old.price)) map.set(url, rec);
    }
  };
  for (let i = 0; i < 28; i++) { grab(); if (feed) feed.scrollTop = feed.scrollHeight; await sleep(650); }
  grab();
  return [...map.values()];
});
writeFileSync(`${OUT}/raw_maps.json`, JSON.stringify(maps, null, 1));
console.log(`raw_maps.json: ${maps.length} ร้าน`);

// ---- 2) OSM Overpass : fetch ผ่าน browser context (เลี่ยง 406 จาก datacenter IP) ----
const osm = await page.evaluate(async (c) => {
  const q = `[out:json][timeout:25];node[amenity~"^(restaurant|cafe|fast_food)$"][name](around:800,${c.lat},${c.lon});out body;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(q) });
  const j = await r.json();
  return j.elements.map(e => ({ name: e.tags.name || null, name_en: e.tags["name:en"] || null,
    cuisine: e.tags.cuisine || null, hours: e.tags.opening_hours || null,
    website: e.tags.website || e.tags["contact:website"] || null,
    phone: e.tags.phone || e.tags["contact:phone"] || null, lat: e.lat, lon: e.lon })).filter(x => x.name);
}, CENTER);
writeFileSync(`${OUT}/raw_osm.json`, JSON.stringify(osm, null, 1));
console.log(`raw_osm.json: ${osm.length} ร้าน`);

await browser.close();
