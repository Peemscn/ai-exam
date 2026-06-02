# Prompt Log — AI Food Assistant (q3)

**AI:** Claude Opus 4.8 (Claude Code) · Output: `restaurant-report.html` + data pipeline
แนวทาง: เน้น **ผลลัพธ์ตาม requirement** (ข้อมูลจริง 2 แหล่ง / scoring / automation / HTML) — เลือก code-based stack แทน no-code tools

---

## Prompt 1 — ตีโจทย์ + เลือก stack
```
อ่านโจทย์ q3 ทุก tab (โจทย์หลัก/รายละเอียดงาน/HTML Output/Tech Stack/เกณฑ์ตรวจ)
สรุป requirement + scoring 6 หมวด แล้วเสนอ stack ที่ได้ requirement เดียวกัน
โดยไม่ผูกกับ tool เป๊ะ (เน้นผลลัพธ์): scrape จริง ≥20 ร้าน 2 แหล่ง, scoring 100, HTML
เช็คว่าย่านไหนข้อมูลเยอะสุด (OSM Overpass count)
```
→ เลือกอโศก (309 ร้าน), stack: Playwright + OSM + Claude + Python + HTML

## Prompt 2 — Scrape Google Maps
```
ใช้ Playwright scroll feed Google Maps ดึงร้านย่านอโศก: name/rating/reviews/price/category/url
ระวัง virtual list (cards ถูก recycle) → เก็บแบบ incremental (Map by url, keep record ที่ field ครบ)
review count ดึงจาก text pattern "4.8(1,234)", price จาก "฿200-400"
```
→ 91 ร้าน review+price ครบ (incremental แก้ virtual list)

## Prompt 3 — แหล่งที่ 2 (OSM Overpass)
```
ยิง Overpass API ผ่าน browser fetch (curl โดน 406 จาก datacenter IP):
node[amenity~restaurant|cafe|fast_food][name](around:800, lat,lon)
ดึง cuisine/opening_hours/website/coordinates
```
→ 229 ร้าน (110 มี cuisine) = แหล่งที่ 2

## Prompt 4 — Merge + Clean
```
รวม Maps + OSM (match by name fuzzy), parse:
- price band → min/max, coords จาก Maps URL (!3d!4d), address จาก meta (ข้าม status line)
- distance haversine จาก Asok BTS, dedupe ชื่อซ้อน
แยก raw / clean ชัดเจน → JSON + CSV
```

## Prompt 5 — Scoring Model 100
```
ออกแบบสูตรโปร่งใส 6 หมวดตามน้ำหนักโจทย์:
Rating&Review 25 (rating + log(reviews)) · Group 20 (ประเภท+ความนิยม) · Price 15 (เหมาะงบทีม)
· Travel 15 (ระยะจาก BTS) · DataComplete 15 · Uniqueness 10
อธิบายวิธีคิดได้ + reproducible
```

## Prompt 6 — AI Insight + Ranking
```
จาก Top 10 วิเคราะห์ Top 3: เหตุผลที่เหมาะทีม 8-12 (ใกล้สถานี/เมนูแชร์/รับกลุ่ม)
+ trade-off (ข้อควรระวังจริง ไม่ใช่ชมอย่างเดียว) + overall insight ของย่าน
```

## Prompt 7 — HTML Report
```
สร้าง HTML หน้าเดียว 9 sections ตาม HTML Output tab: header/objective/workflow/tools/
data sources/scoring/Top10 table/Top3 cards/comparison + evidence links (Maps URL ต่อร้าน)
responsive + dark mode, self-contained
```

---
**หมายเหตุ:** ทำผ่าน Claude Code (สั่งภาษาไทย) — แนบ chat log เต็มเป็น prompt history
