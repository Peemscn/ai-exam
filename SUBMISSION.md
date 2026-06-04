# AI Workflow Challenge — Submission

**DEV : PEEM** · มิถุนายน 2026

---

## 🌐 Live Demo (ยกระดับเป็น Fullstack — เกินโจทย์)

รวมทั้ง 3 โจทย์เป็น **Next.js app เดียว + Turso DB + deploy Vercel**:

### → https://web-six-theta-78.vercel.app

| Route | โจทย์ |
|---|---|
| `/q1` | Player Feedback Insight (classify 300 + charts + ตาราง + aggregate API) |
| `/q2` | Gacha Simulator (sim / Monte Carlo / pity / CSV + บันทึก session ลง DB) |
| `/q3` | AI Food Assistant (103 ร้าน 5 ย่าน + ถาม AI สด + re-scrape Apify + chromium replay) |
| `/api-docs` | Swagger UI (OpenAPI 3.1) |

**Source code:** https://github.com/Peemscn/ai-exam
**Stack:** Next.js 16 · React 19 · TypeScript · Turso (libSQL) · Apify · pino · vitest (46 tests) · Vercel

---

## 📦 ไฟล์ส่ง (ในโฟลเดอร์นี้)

### q1 — Player Feedback Insight Report
- `feedback_report.html` — รายงานหลัก (8 sections + chart)
- `classified_data.html` — ตาราง 300 feedback (interactive)
- `feedback_analysis.xlsx` — ข้อมูล classified
- `prompt_log.md` · `workflow.md` · `validation_note.md`

### q2 — Gacha Drop Rate Simulator
- `gacha-simulator.html` — ไฟล์เดียวเปิด browser ได้เลย (rate / item pool / single sim / Monte Carlo Player POV / pity / CSV) · core 110 + bonus 20
- `prompt_log.md` · `reflection.md`

### q3 — AI Food Assistant
- `restaurant-report.html` — รายงาน (Top3 / Top10 / search 90 ร้าน + AI Q&A)
- `restaurant_data.xlsx` — Raw / Clean / Scoring (3 sheets)
- `prompt_log.md` · `workflow.md` · `reflection.md`

---

## วิธีดู

- **เร็วสุด:** เปิด live demo (link ด้านบน) — ครบทุกโจทย์ + interactive
- **ไฟล์ static:** เปิด `*.html` ใน browser ได้เลย (self-contained) · `*.xlsx` เปิด Excel/Sheets
- **Prompt Log:** `prompt_log.md` แต่ละโฟลเดอร์ (กระบวนการคิด + prompt ที่ใช้กับ AI)
