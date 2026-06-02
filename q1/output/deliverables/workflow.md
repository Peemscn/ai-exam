# Workflow Explanation — AI Feedback Classifier

## ภาพรวม pipeline

```
Data (300 rows) → Clean / strip filler → AI Classify (Claude · 65 intents)
   → Priority weighting (player_segment) → Insight + Cross-tab → Report (HTML)
```

ทุกขั้นทำเป็นสคริปต์ที่ **รันซ้ำได้ (reproducible)** — ป้อน dataset เดิมได้ผลเดิม

---

## รายละเอียดแต่ละขั้น

### 1. DATA INPUT
- Input: `player_feedback_300_dataset.xlsx` → sheet `Feedback_Raw` (300 แถว, 9 คอลัมน์)
- Export เป็น JSON ด้วย `export_feedback.py` เพื่อให้ AI/สคริปต์อ่านง่าย
- ช่วงข้อมูล: 1–23 พฤษภาคม 2026 · Version v1.8.0–v1.9.1 · 8 ช่องทาง · 3 platform · 8 player segment

### 2. DATA PREPARATION / CLEANING
- **Quality check** (`export_feedback.py`): 300/300 records, **0 duplicate, 0 empty feedback**, game_area_hint ว่าง 100 แถว (ใช้ core message ชดเชย)
- **Strip filler**: ข้อความเป็น template → ตัด prefix/suffix ที่สุ่มมา (`อยากฝากทีมงานว่า`, `ขอบคุณครับ/ค่ะ`, `รบกวนช่วยดูให้หน่อย` ฯลฯ) เหลือ **core message** ก่อนวิเคราะห์
- แยก player_segment เป็น tier (จ่ายเงินสูง / spender / เสี่ยง churn / ฐาน) ไว้ใช้ถ่วงน้ำหนัก priority

### 3. AI CLASSIFICATION
- **AI engine:** Claude Opus 4.8 อ่าน feedback ทั้ง 300 รายการ → จับเป็น **65 canonical intents** → ตีความ sentiment / category / priority / owner / summary ของแต่ละ intent ตามความหมายภาษาไทย
- **Encode เป็น rules** (`classify.py`) เพื่อ apply กับ 300 รายการแบบ deterministic — ผลออกมา **consistent 100%** (intent เดียวกัน label เดียวกัน) และ **auditable** (ตรวจย้อนได้ว่าทำไมจัดแบบนั้น)
- ใส่ครบทุกแถว: `sentiment, category (9 หมวด + Other), priority, ai_summary, suggested_owner, confidence, review_note`
- ผล: Negative 72.3% / Neutral 20.3% / Positive 7.3% · unmatched = 0

> **ทำไมเลือกวิธีนี้ (ไม่ใช่ LLM-per-row):** dataset เป็น template ที่ intent ซ้ำกัน — การให้ AI ออกแบบ rubric แล้ว encode เป็น rule ให้ผลที่ **สม่ำเสมอ ทำซ้ำได้ ตรวจสอบได้ และ scale ฟรี** (300→3000 ก็รันต่อได้) ซึ่งตรงกับ best practice ของ production ML (human/AI labeling → rule/model). ถ้าข้อมูลจริงหลากหลายกว่านี้ จะสลับไปใช้ LLM-per-row ด้วย Prompt 3 ใน `prompt_log.md` ได้ทันที

### 4. PRIORITY WEIGHTING (จุดเด่น — ถ่วงตาม player_segment)
- Whale / Guild Leader บ่นเรื่องรายได้ (Gacha/Economy) → **+1 priority** (กระทบ revenue)
- New / Returning เจอปัญหา onboarding/retention → **+1 priority** (เสี่ยง churn)
- Account / Payment (login/จ่ายเงินถูกบล็อก) → **High เสมอ**
- ทุกการ bump บันทึกเหตุผลใน `review_note` (โปร่งใส)

### 5. INSIGHT GENERATION (`insights.py`)
ไม่ใช่แค่นับ — คำนวณ cross-tab แล้วตีความ:
- **segment × sentiment** → Light Spender/F2P negative สูงสุด (83%), Whale ต่ำสุด (66%)
- **version trend** → v1.9 regression (neg 63%→78%)
- **platform × bug** → iOS hotspot (14.8%)
- **revenue / retention risk** → 32 เสียงลบเรื่องเงินจากกลุ่มจ่ายเงิน · New/Returning neg 64%
- **Top issues by intent** → Gameplay/Balance ครอง 4/5

### 6. REPORT GENERATION (`gen_report.py`)
- `feedback_report.html` — ไฟล์เดียว self-contained (chart เป็น CSS ไม่พึ่ง CDN เปิด offline ได้)
- ครบ 8 sections ตาม Report Template + KPI cards + donut/bar charts + ตัวอย่าง feedback จริงพร้อม feedback_id

### 7. HUMAN REVIEW (`validate_sample.py` → `validation_note.md`)
- สุ่ม stratified 30 รายการ (10%) รวม low-confidence ทุกตัว — ตรวจมือ
- ผล: sentiment/category ถูก 30/30, low-confidence 12/12 ถูก
- ระบุ limitations ตรงไปตรงมา (self-review bias, template dataset, sarcasm ฯลฯ)

---

## Tech Stack
| งาน | เครื่องมือ |
|---|---|
| อ่าน/เขียน xlsx | Python + openpyxl |
| AI classification + insight | Claude Opus 4.8 (Claude Code) |
| Report | HTML/CSS (self-contained, ไม่พึ่ง library ภายนอก) |
| Reproducibility | สคริปต์ Python ทั้งหมด + seed คงที่ |

## โครงสร้างไฟล์ (`q1/output/`)
```
q1/output/
├── deliverables/   ← สิ่งที่ส่งจริง
│   ├── feedback_analysis.xlsx   [ส่ง] Cleaned + classified 300 แถว (README + Classified Data + Data Dictionary)
│   ├── classified_data.html     [ส่ง] ตาราง 300 แถว interactive (search/filter/sort/pagination/CSV/dark/responsive) — ดูแทน Excel/Sheet
│   ├── feedback_report.html     [ส่ง] Insight Report 8 sections + charts (responsive + dark + TOC nav + print)
│   ├── prompt_log.md            [ส่ง] Prompt ที่ใช้ + คำอธิบาย
│   ├── workflow.md              [ส่ง] เอกสารนี้
│   ├── validation_note.md       [ส่ง] ผล human review + limitations
│   ├── evidence.md              [ส่ง] หลักฐานการใช้ tools
│   └── evidence-claude-code-1..3.png · report-screenshot.jpeg   (screenshot ประกอบ evidence)
├── src/            ← สคริปต์ Python (reproducible — rerun ได้ผลเดิม)
│   ├── export_feedback.py · classify.py · build_xlsx.py
│   └── insights.py · gen_report.py · gen_table.py · validate_sample.py
└── data/           ← ไฟล์ตัวกลาง: feedback_raw.json · classified.jsonl · insights.json
```
รัน pipeline ใหม่จาก root: `python q1/output/src/export_feedback.py` → `classify.py` → `build_xlsx.py` → `insights.py` → `gen_report.py` → `gen_table.py`
