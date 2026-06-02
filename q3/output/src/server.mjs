// server.mjs — Backend API: re-scrape Google Maps + OSM สด แล้วให้หน้าเว็บกดเรียกได้
//   GET /api/scrape  → launch Playwright scrape Maps+OSM → spawn Python clean+score → scored JSON
//   GET /            → serve restaurant-report.html
// ติดตั้ง: npm i playwright && npx playwright install chromium
// รัน (จาก repo root): node q3/output/src/server.mjs  → http://localhost:8090
import http from "http";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { chromium } from "playwright";

const PORT = 8090;
const DELIV = "q3/output/deliverables";
const DATA  = "q3/output/data";
const PY = process.env.PY || ".venv/bin/python";
const CENTER = { lat: 13.7383, lon: 100.5614 };

async function scrapeAll() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // 1) Google Maps — scroll feed + extract DOM (incremental กัน virtual-list recycle)
  await page.goto("https://www.google.com/maps/search/restaurants+near+Asok+Bangkok");
  await page.waitForSelector("div.Nv2PK", { timeout: 25000 });
  const maps = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const feed = document.querySelector('[role="feed"]'); const map = new Map();
    const grab = () => { for (const c of document.querySelectorAll("div.Nv2PK")) {
      const name = (c.querySelector(".qBF1Pd") || {}).textContent; if (!name) continue;
      const url = (c.querySelector("a.hfpxzc") || {}).href || name;
      const txt = c.textContent || "";
      const rm = txt.match(/(\d(?:\.\d)?)\s*\(([\d,]+)\)/);
      const pm = txt.match(/฿[\d,]+(?:[-–][\d,]+)?\+?|฿฿+/);
      const cat = (c.querySelector(".W4Efsd") || {}).textContent || "";
      const rec = { name, rating: rm ? parseFloat(rm[1]) : null, reviews: rm ? parseInt(rm[2].replace(/,/g, "")) : null,
        price: pm ? pm[0] : null, category: (cat.split("·")[0] || "").trim(),
        meta: [...c.querySelectorAll(".W4Efsd")].map(e => e.textContent.trim()).filter(Boolean), url };
      const old = map.get(url);
      if (!old || (rec.reviews && !old.reviews) || (rec.price && !old.price)) map.set(url, rec);
    }};
    for (let i = 0; i < 28; i++) { grab(); if (feed) feed.scrollTop = feed.scrollHeight; await sleep(650); }
    grab(); return [...map.values()];
  });
  writeFileSync(`${DATA}/raw_maps.json`, JSON.stringify(maps, null, 1));
  // 2) OSM Overpass — fetch ผ่าน browser context (เลี่ยง 406)
  const osm = await page.evaluate(async (c) => {
    const q = `[out:json][timeout:25];node[amenity~"^(restaurant|cafe|fast_food)$"][name](around:800,${c.lat},${c.lon});out body;`;
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
    const j = await r.json();
    return j.elements.map(e => ({ name: e.tags.name || null, name_en: e.tags["name:en"] || null, cuisine: e.tags.cuisine || null,
      hours: e.tags.opening_hours || null, website: e.tags.website || e.tags["contact:website"] || null,
      phone: e.tags.phone || e.tags["contact:phone"] || null, lat: e.lat, lon: e.lon })).filter(x => x.name);
  }, CENTER);
  writeFileSync(`${DATA}/raw_osm.json`, JSON.stringify(osm, null, 1));
  await browser.close();
  // 3) clean + score (reuse Python pipeline เดิม)
  execSync(`${PY} ${DELIV}/../src/clean.py && ${PY} ${DELIV}/../src/score.py`, { stdio: "inherit" });
  return JSON.parse(readFileSync(`${DATA}/scored.json`, "utf8"));
}

http.createServer(async (req, res) => {
  const cors = { "access-control-allow-origin": "*" };
  if (req.url.startsWith("/api/scrape")) {
    console.log("[scrape] เริ่ม re-scrape สด...");
    try {
      const scored = await scrapeAll();
      const data = scored.map(r => ({ rank: r.rank, name: r.name, cat: r.category, rating: r.rating,
        reviews: r.reviews, price: r.price_text, dist: r.distance_m, total: r.total, url: r.source_maps || "", scores: r.scores }));
      console.log(`[scrape] เสร็จ ${data.length} ร้าน`);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", ...cors });
      res.end(JSON.stringify({ ok: true, count: data.length, data }));
    } catch (e) {
      console.error("[scrape] error:", e.message);
      res.writeHead(500, { "content-type": "application/json; charset=utf-8", ...cors });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  } else {
    try { res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(readFileSync(`${DELIV}/restaurant-report.html`)); }
    catch (e) { res.writeHead(404); res.end("restaurant-report.html not found"); }
  }
}).listen(PORT, () => console.log(`▶ http://localhost:${PORT}  — เปิดแล้วกดปุ่ม "re-scrape สด" บนหน้าเว็บได้`));
