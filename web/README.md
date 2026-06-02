# AI Exam Lab — รวม 3 โจทย์ AI Workflow (Next.js + Turso)

Fullstack app รวม q1/q2/q3 เป็นเว็บเดียว · Next.js 16 (App Router) · Turso (libSQL/SQLite) · deploy Vercel
(DEV : PEEM)

## Routes — คำตอบแต่ละโจทย์

| Route | โจทย์ | ทำอะไร |
|---|---|---|
| `/` | landing | รวม 3 โจทย์ + nav |
| `/q1` | Player Feedback Insight | classify 300 feedback → insight charts + 300-row table (ค้นหา/กรอง) + aggregate |
| `/q2` | Gacha Simulator | rates / item pool / single sim / **Monte Carlo** / pity / free roll / CSV + บันทึก session ลง DB |
| `/q3` | AI Food Assistant | 90 ร้าน Top3/Top10/search + **ถาม AI** + **re-scrape สด** |

## API

| Endpoint | ทำอะไร |
|---|---|
| `POST /api/ask` | ถาม Claude แนะนำร้าน (q3) — key จาก **user input** (หรือ env) |
| `GET /api/restaurants` | ร้าน 90 (query Turso ถ้ามี env / fallback JSON) |
| `GET /api/feedback?by=category` | aggregate `GROUP BY` (q1) — `by` = category/sentiment/priority/suggested_owner |
| `GET·POST /api/gacha` | อ่าน/บันทึก Monte Carlo session (q2) |
| `POST /api/scrape` | trigger GitHub Action re-scrape (q3) |

## Database — Turso (libSQL / SQLite)

- schema: `db/schema.sql` — `restaurants` · `feedback` · `gacha_sessions` · `scrape_runs`
- seed: `node --env-file=.env.local db/seed.mjs` (restaurants 90 + feedback 300)
- client: `lib/db.ts` — remote ถ้ามี `TURSO_DATABASE_URL`, ไม่งั้น fallback `file:local.db`

## Dev

```bash
npm install
cp .env.example .env.local      # ใส่ค่าตาม comment
npm run dev                     # http://localhost:3000  (/q1 /q2 /q3)
```

## Deploy (Vercel)

1. push GitHub → Vercel → New Project → import → **Root Directory = `web`**
2. Environment Variables:
   - `ANTHROPIC_API_KEY` — ออปชัน (q3 AI Q&A ปกติ user ใส่ key เองในช่อง)
   - `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` — สำหรับ DB (สร้างที่ app.turso.tech)
   - `GITHUB_TOKEN` + `GITHUB_REPO` — สำหรับปุ่ม re-scrape
3. Deploy แล้ว seed DB: `node --env-file=.env.local db/seed.mjs`

## ที่มา (source งานเดิมของแต่ละโจทย์)

- **q1** logic/data: `../q1/output/` (classify.py, insights.py) → seed จาก `data/feedback*.json`
- **q2** logic: `../q2/output/tests/gacha-logic.mjs` → `lib/gacha.ts`
- **q3** pipeline: `scripts/{scrape.mjs, clean.py, score.py}` (= `../q3/output/src/`) + CI `.github/workflows/scrape.yml`

## Testing

```bash
npm test          # vitest — 32 unit tests (lib/gacha · lib/format)
```

REST API features: server-side pagination (`?page&limit&q&sort&filter`) · pino logging ทุก route · rate limit 20/นาที (`/api/ask`) · theme dark/light · loading skeleton + error retry · ดู endpoints ที่ `/api-docs`

## Stack

Next.js 16 · React 19 · TypeScript · Turso (libSQL) · pino (logging) · vitest (tests) · Playwright (CI scrape) · Python (clean/score) · Claude API
