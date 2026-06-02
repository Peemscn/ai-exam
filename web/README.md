# AI Exam Lab — รวม 3 โจทย์ AI Workflow (Next.js 16 + Turso)

Fullstack app รวม q1/q2/q3 เป็นเว็บเดียว · Next.js 16 (App Router) · Turso (libSQL) · Apify scrape · deploy Vercel · DEV : PEEM
**ใช้ `bun` เป็น runtime/PM (ไม่ใช่ npm/node)**

## Routes — คำตอบแต่ละโจทย์

| Route | โจทย์ | ทำอะไร |
|---|---|---|
| `/` | landing | รวม 3 โจทย์ + nav |
| `/q1` | Player Feedback Insight | classify 300 feedback → insight charts + 300-row table + aggregate |
| `/q2` | Gacha Simulator | rates / pool / single sim / **Monte Carlo** / pity / CSV + บันทึก session ลง DB |
| `/q3` | AI Food Assistant | **103 ร้าน 5 พื้นที่** · Top3/Top10/search + **ถาม AI** + **re-scrape สด** |
| `/api-docs` | — | Swagger UI (OpenAPI 3.1, interactive) |

## API — envelope `{ data, meta, error }`

| Endpoint | ทำอะไร |
|---|---|
| `GET /api/restaurants` | ร้าน · `?page&limit&q&sort&area` · query Turso (fallback JSON) |
| `GET /api/feedback` | `?by=` aggregate GROUP BY · หรือ list `?page&q&category&sentiment&priority` |
| `GET·POST /api/gacha` | อ่าน/บันทึก Monte Carlo session |
| `POST /api/ask` | ถาม Claude (key จาก user input) · rate limit 20/นาที |
| `POST /api/scrape` | re-scrape — **Apify primary → CI fallback → chromium (local)** |

## Database — Turso (libSQL)

- schema `db/schema.sql` (restaurants · feedback · gacha_sessions · scrape_runs)
- seed: `bun --env-file=.env db/seed.mjs`
- client `lib/db.ts` — remote ถ้ามี `TURSO_DATABASE_URL`, ไม่งั้น fallback `file:local.db`

## Dev

```bash
bun install
cp .env.example .env        # ใส่ค่า (ANTHROPIC/TURSO/APIFY)
bun run dev                 # http://localhost:3000  (/q1 /q2 /q3 /api-docs)
```

## Scrape ร้าน (Apify — primary)

```bash
bun --env-file=.env scripts/scrape-apify.mjs   # Apify Google Maps Scraper (5 พื้นที่) → data/raw_maps.json
python3 scripts/clean.py && python3 scripts/score.py   # → clean + scored.json
bun --env-file=.env db/seed.mjs                # reseed Turso
```
> fallback ถ้าไม่มี APIFY_TOKEN → `scripts/scrape.mjs` (chromium — แต่ Maps ส่ง lite DOM)

## Testing

```bash
bun run test     # vitest — 32 unit tests (lib/gacha · lib/format)
```

## Deploy

- **Vercel (auto-connect):** เชื่อม GitHub repo → **Root Directory = `web`** → env (`ANTHROPIC_API_KEY` · `TURSO_DATABASE_URL` · `TURSO_AUTH_TOKEN` · `APIFY_TOKEN`) → **auto deploy ทุก push** (+ preview ทุก PR · ไม่ต้อง token)
- **CI** (root `.github/workflows/`):
  - `ci.yml` — bun install + vitest + build (quality gate ทุก push/PR)
  - `scrape.yml` — re-scrape (weekly + manual · secret `APIFY_TOKEN` + `TURSO_*`)

## Stack

Next.js 16 · React 19 · TypeScript · Turso (libSQL) · Apify · pino (logging) · vitest · Python (clean/score) · Claude API
