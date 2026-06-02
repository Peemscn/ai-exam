# AI Workflow Challenge — โจทย์สอบ 3 ข้อ

**ผู้ทำ:** DEV : PEEM · มิถุนายน 2026
**แนวทาง:** ทำด้วย Claude (Claude Code) + code-based stack เน้น**ผลลัพธ์ตาม requirement**

---

## โครงสร้างโปรเจกต์
```
qN/
├── <โจทย์>.xlsx              # โจทย์ต้นฉบับ (+ ไฟล์ประกอบ)
└── output/
    ├── data/                 # ข้อมูลตัวกลาง (q1, q3)
    ├── src/                  # สคริปต์ pipeline (reproducible)
    ├── tests/                # unit test (q1, q2)
    └── deliverables/         # สิ่งที่ส่ง
        ├── <ไฟล์หลัก>         # html / xlsx / md
        ├── evidence/         # evidence.md + screenshot session (Claude Code)
        └── result/           # screenshot ผลงานที่ render + หลักฐาน scraping
```

## q1 — Player Feedback Insight Report
Classify feedback ผู้เล่นเกม **300 รายการ** (sentiment/category/priority/owner) → Insight + Report
- **Deliverables:** `feedback_analysis.xlsx` · `feedback_report.html` (8 sections + chart) · `classified_data.html` (ตาราง interactive) · prompt_log / workflow / validation_note
- **Tests:** 24 เคส (`python q1/output/tests/test_classify.py`)
- Approach: Claude อ่าน 300 → 65 canonical intents → rule-based classifier + priority ถ่วง player_segment

## q2 — Gacha Drop Rate Simulator
HTML ไฟล์เดียว: rate setting / item pool / single sim / **Monte Carlo player POV** / pity / CSV export
- **Deliverables:** `gacha-simulator.html` (core 110 + bonus 20, responsive + dark) · prompt_log / reflection
- **Tests:** 12 เคส (`node --test q2/output/tests/` หรือ `bun test`)

## q3 — AI Food Assistant
หาร้านมื้อทีม 8–12 คน ย่าน**อโศก**: scrape **90 ร้าน** (Google Maps + OSM) → scoring 100 → รายงาน
- **Deliverables:** `restaurant-report.html` (10 sections + **AI Q&A** ต่อ Claude API + **search/filter 90 ร้าน** interactive) · `restaurant_data.xlsx` (Raw/Clean/Scoring) · prompt_log / reflection
- **Data:** raw_maps(91) · raw_osm(229) · clean(90) · scored(90)
- **Tests:** 31 เคส (`q3/output/tests/test_pipeline.py` — parse/scoring, success/fail/edge)
- **รวมในเว็บเดียว** → ดู section `web/` ด้านล่าง

---

## 🌐 web/ — รวม q1+q2+q3 เป็น Next.js app เดียว (Vercel + Turso)

ยกทั้ง 3 โจทย์เป็น fullstack เว็บเดียว — แต่ละโจทย์เป็น route, มี **API จริง + Turso (libSQL/SQLite) DB**

| Route | โจทย์ | source งานเดิม |
|---|---|---|
| `/` | landing รวม 3 โจทย์ | — |
| `/q1` | Player Feedback (insight charts + 300-row table + aggregate) | `q1/output/` |
| `/q2` | Gacha Simulator (sim / Monte Carlo / pity + DB session) | `q2/output/` |
| `/q3` | AI Food Assistant (90 ร้าน + AI Q&A + re-scrape สด) | `q3/output/` |

- **API:** `/api/ask` (Claude) · `/api/feedback` (aggregate SQL) · `/api/gacha` (session R/W) · `/api/restaurants` · `/api/scrape`
- **DB (Turso):** `web/db/schema.sql` + `seed.mjs` (restaurants 90 + feedback 300) · fallback JSON ถ้าไม่ตั้ง env
- **Deploy:** Vercel (Root Directory = `web`) — รายละเอียด + ตาราง map ใน `web/README.md`

> static เดิม (`qN/output/deliverables/`) ยังเก็บไว้ส่ง exam แยกข้อ

---

## วิธีรัน
```bash
# q1
python q1/output/src/export_feedback.py && python q1/output/src/classify.py && \
python q1/output/src/build_xlsx.py && python q1/output/src/insights.py && \
python q1/output/src/gen_report.py && python q1/output/src/gen_table.py

# q2 — เปิดในเบราว์เซอร์ได้เลย
open q2/output/deliverables/gacha-simulator.html

# q3 — scrape ก่อน (Playwright Node) แล้วประมวลผล
npm i playwright && node q3/output/src/scrape.mjs   # scrape Maps + OSM → data/raw_*.json
python q3/output/src/clean.py && python q3/output/src/score.py && \
python q3/output/src/gen_report.py && python q3/output/src/build_xlsx.py
node q3/output/src/server.mjs   # (option, static version) http://localhost:8090 + ปุ่ม "re-scrape สด"

# web — รวม 3 โจทย์ (Next.js + Turso → Vercel)
cd web && npm install && npm run dev   # http://localhost:3000 · /q1 /q2 /q3
# (option) seed Turso DB: cd web && node --env-file=.env.local db/seed.mjs

# tests
python q1/output/tests/test_classify.py        # 24
node --test q2/output/tests/gacha.test.mjs      # 12 (หรือ bun test)
python q3/output/tests/test_pipeline.py         # 31
```

## Stack
Claude Opus 4.8 · Python 3.12 (openpyxl) · Playwright (scrape Google Maps) · OSM Overpass API · vanilla HTML/CSS/JS (self-contained, responsive, dark) · node:test / bun · **Next.js 16 / React 19 / TypeScript + Turso (libSQL) — รวม 3 โจทย์ใน `web/` → Vercel**
