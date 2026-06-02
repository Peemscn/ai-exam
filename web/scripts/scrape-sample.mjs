// scrape-sample.mjs — chromium scrape สยาม area เดียว → data/sample_chromium.json
//   เก็บหลักฐาน "headless Google Maps = lite DOM" (ได้ name+rating, ขาด reviews/price/address)
//   เทียบกับ Apify (raw_maps.json) → โชว์ q3 ว่าทำไมเลือก Apify
//   รัน: bun scripts/scrape-sample.mjs
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const area = { name: "สยาม", q: "restaurants near Siam BTS Bangkok" };
const browser = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled", "--lang=th-TH"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1400, height: 900 },
  locale: "th-TH",
});
await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => undefined }));
const page = await ctx.newPage();
await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(area.q)}`);
await page.waitForSelector("div.Nv2PK", { timeout: 25000 }).catch(() => {});
const maps = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const feed = document.querySelector('[role="feed"]');
  const map = new Map();
  const grab = () => {
    for (const c of document.querySelectorAll("div.Nv2PK")) {
      const name = (c.querySelector(".qBF1Pd") || {}).textContent;
      if (!name) continue;
      const url = (c.querySelector("a.hfpxzc") || {}).href || name;
      const txt = c.textContent || "";
      const ariaEl = c.querySelector('[role="img"][aria-label]') || c.querySelector("span[aria-label]");
      const aria = ariaEl ? ariaEl.getAttribute("aria-label") || "" : "";
      const am = aria.match(/([\d.]+)\s*(?:ดาว|star)[^\d]*([\d,]+)/i);
      const rm = txt.match(/(\d(?:\.\d)?)\s*\(([\d,]+)\)/);
      const pm = txt.match(/฿[\d,]+(?:[-–][\d,]+)?\+?|฿฿+/);
      const rec = {
        name,
        rating: am ? parseFloat(am[1]) : rm ? parseFloat(rm[1]) : null,
        reviews: am ? parseInt(am[2].replace(/,/g, "")) : rm ? parseInt(rm[2].replace(/,/g, "")) : null,
        price: pm ? pm[0] : null,
        address: null, // headless lite DOM ไม่ส่ง address
        hours: null,
        website: null,
      };
      const old = map.get(url);
      if (!old || (rec.reviews && !old.reviews)) map.set(url, rec);
    }
  };
  await sleep(2200);
  for (let i = 0; i < 8; i++) {
    grab();
    if (feed) feed.scrollTop = feed.scrollHeight;
    await sleep(1500);
  }
  grab();
  return [...map.values()];
});
writeFileSync("data/sample_chromium.json", JSON.stringify(maps, null, 1));
const has = (f) => maps.filter((m) => m[f]).length;
console.log(`chromium สยาม: ${maps.length} ร้าน · rating=${has("rating")} reviews=${has("reviews")} price=${has("price")} address=${has("address")}`);
await browser.close();
