# Workflow — AI Food Assistant (q3)

**AI:** Claude Opus 4.8 (Claude Code) · **ผู้ทำ:** DEV : PEEM
**แนวคิด:** เน้นผลลัพธ์ตาม requirement → เลือก stack ที่ได้ผลนั้น (code-based) · iterate เมื่อเจอข้อจำกัดจริง

โจทย์: หาร้านมื้อทีม 8-12 คน 5 ย่าน (สยาม/อารีย์/ทองหล่อ/อโศก/พร้อมพงษ์) — แนะนำพร้อมเหตุผล
**Pipeline:** Scrape (2 แหล่ง) → Clean (merge/dedupe) → Score (100 คะแนน 6 หมวด) → Analysis (Claude) → Report

---

## Phase 1 — Static deliverable (`q3/output/`)

Code-based pipeline ย่านอโศก:
1. **Scrape Google Maps (Playwright)** — name/rating/reviews/price/category
   - ติด **virtual list** (scroll → card recycle → review/price หาย) → แก้ด้วย incremental (เก็บ Map by url, keep เฉพาะ record ที่ field ครบ)
2. **OSM Overpass** (แหล่งที่ 2) — cuisine/hours/website/พิกัด
   - ยิง API ตรงจาก server โดน **406** (datacenter IP block) → ยิงผ่าน browser fetch (มี UA จริง)
3. **Clean** — merge fuzzy by name · parse price/coords/address (ข้าม status line) · haversine จาก BTS · dedupe ชื่อซ้อน
4. **Score 100** (6 หมวดโปร่งใส) → **Claude วิเคราะห์ Top 3 + trade-off** → **HTML report**

→ 90 ร้านอโศก · `restaurant-report.html` + `restaurant_data.xlsx`

---

## Phase 2 — รวมเป็นเว็บเดียว (`web/` → Next.js 16 + Turso + Vercel)

ยกเป็น fullstack (งานหลักเขียน Next/React + อยากโชว์ DB skill) — รวม q1/q2/q3 · 5 ย่าน · API จริง · DB

### Decision log: scrape (ปัญหาจริง + วิธีแก้)

| # | เจออะไร | แก้ยังไง |
|---|---|---|
| 1 | **chromium headless = lite DOM** — `scripts/scrape.mjs` (headless) Google Maps ส่ง DOM ย่อ: rating/reviews/price บางส่วน (~77%) **ไม่มี address/hours** · ลอง UA spoof / headful+xvfb / persistent context+consent ก็ยัง lite | *(หลักฐาน: `scripts/scrape-sample.mjs` → สยาม 52 ร้าน · rating/price 40/52 · address 0)* |
| 2 | **ลอง MCP playwright browser** — render เต็ม (aria + price) ได้ 330 ร้าน · **แต่เว็บ runtime เรียก MCP ไม่ได้** (MCP = Claude tool ไม่ใช่ web API) | ใช้ตอน dev ได้ แต่ปุ่ม re-scrape บนเว็บไม่ได้ → ต้องหา scrape API จริง |
| 3 | **→ Apify Google Maps Scraper (REST API)** — actor `compass/crawler-google-places` · render เต็ม + reliable + ตรง Tech Stack โจทย์ + free $5/mo ไม่ผูกบัตร · เป็น **HTTP API → เว็บ/serverless เรียกได้จริง** | ได้ **103 ร้าน 5 ย่าน** data ครบ (rating/reviews/price/address/hours/website/พิกัด) |

### Decision log: architecture re-scrape (iterate)

- **รอบแรก:** `/api/scrape` → trigger **GitHub Action CI** (คิดว่า scrape ต้อง browser/python ที่ Vercel serverless ไม่มี)
- **ปรับ:** Apify = REST API → **Vercel serverless เรียกตรงได้** ไม่ต้อง CI → port `clean.py`+`score.py` เป็น **`lib/pipeline.ts`** (in-memory: Apify fetch → clean → score → seed Turso batch) → `/api/scrape` เรียก pipeline ตรง **ทั้ง local + prod** (ตัด chromium/python/CI/GITHUB)
- **verify prod:** กดปุ่มยิงจริง 178s → Apify 104 → clean 102 → seed Turso

### Decision log: DB consistency (Flow A)

- เดิม q3 page อ่าน top3/stats จาก `scored.json` (static, build-time) · search อ่าน Turso → **กด re-scrape แล้ว search เปลี่ยน แต่ top3 ไม่ (ขัดกัน)**
- แก้: q3 page → `async` + `force-dynamic` ดึง Turso ทั้งหน้า (`lib/restaurants.ts` map flat→nested, fallback scored.json) → **re-scrape เปลี่ยนทั้งหน้า sync**

### Stack decision (ทำไม)

- **Turso (libSQL)** — read-heavy + SQL + free โหด (500M reads) + edge SG ใกล้ไทย
- **Apify** > chromium (lite DOM) > Google Places API (เลิก free ก.พ.2025 + ต้องบัตร)
- **Flow A (DB ทั้งหน้า)** > scored.json static — consistent หลัง re-scrape · DB เป็น single source

→ deploy public **`web-six-theta-78.vercel.app`** · pipeline TS **46 vitest** · CI manual (`workflow_dispatch` + chromium fallback)

---

## หลักฐาน (ตรวจย้อนได้)

- **2-column chromium vs Apify** (q3 page section "แหล่งข้อมูล") — โชว์ headless ได้แค่ lite, Apify เต็ม
- `data/sample_chromium.json` (chromium จริง) · `data/raw_maps.json` (Apify) · `data/scored.json` (scored)
- ปุ่ม **re-scrape** (Apify REST → update Turso) — กดทดสอบบน prod ทำงานจริง
