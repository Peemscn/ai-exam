# Evidence — q3 AI Food Assistant

## Tools ที่ใช้
| Tool | ใช้ทำอะไร |
|---|---|
| **Playwright** | scrape Google Maps (เรตติ้ง/รีวิว/ราคา) + ยิง OSM Overpass ผ่าน browser fetch |
| **OSM Overpass API** | cuisine/พิกัด/เวลาเปิด (แหล่งที่ 2) |
| **Claude Opus 4.8 / Haiku 4.5** | scoring model + insight/trade-off + AI Q&A แบบ interactive |
| **Python** | merge/clean/normalize + คะแนน 100 |
| **HTML/CSS/JS** | รายงาน responsive + dark + AI Q&A box |

## หลักฐาน
1. **`evidence-claude-code-1..9.png`** (โฟลเดอร์นี้) — screenshot Claude Code session ตลอด flow
2. **`../result/report-screenshot.jpeg` · `report-mobile-dark.jpeg`** — `restaurant-report.html` render จริง (desktop + mobile/dark)
3. **`../result/evidence_1/` · `evidence_2/`** — หลักฐานการ scrape (network request + ผลลัพธ์)
4. **แหล่งข้อมูล (ตรวจย้อนกลับได้):** Google Maps `search/restaurants+near+Asok+Bangkok` · OSM `overpass-api.de` · Maps URL ต่อร้าน (90 ร้าน) ฝังใน report คอลัมน์ "หลักฐาน" + `clean.json`
5. **`../restaurant-report.html`** (9 sections + AI Q&A) · **`../restaurant_data.xlsx`** (3 sheets: Raw/Clean/Scoring = แทน Google Sheets link)
6. **`../../src/`** — `scrape.mjs` (Playwright scrape) · `server.mjs` (backend API `/api/scrape` — re-scrape สดจากหน้าเว็บ) · `clean.py`/`score.py`/`gen_report.py` · **`../../tests/test_pipeline.py`** unit test **31** (success/fail/edge)
7. **`../../data/`** — raw_maps(91)/raw_osm(229)/clean(90)/scored(90)
8. **`../prompt_log.md`** — prompt ที่ใช้ทุกขั้น

## วิธีรัน / ทำซ้ำ
```
# scrape: ผ่าน Playwright browser (Maps scroll + OSM fetch) → data/raw_*.json
python q3/output/src/clean.py → score.py → gen_report.py → build_xlsx.py
```

## ขอบเขต (honest)
- ข้อมูลจริง 90 ร้าน 2 แหล่ง · code-based stack แทน Apify/n8n/Sheets (เน้นผลลัพธ์ตาม requirement — ดู `../reflection.md`)
- หลักฐานหลัก: chat log เต็มของ session Claude Code
