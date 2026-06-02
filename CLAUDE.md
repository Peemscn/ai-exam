# ai-test-lab — project rules

## Package manager / runtime: ใช้ `bun` เสมอ (ห้าม npm/node)
- `bun install` — ไม่ใช่ `npm install`
- `bun run build` / `bun run dev` / `bun run start` — ไม่ใช่ `npm run ...`
- `bun run test` — vitest (web/)
- `bun <script>.mjs` — ไม่ใช่ `node` · เช่น `bun --env-file=.env db/seed.mjs`
- `bunx <tool>` — ไม่ใช่ `npx` · เช่น `bunx playwright install chromium`

## โครงสร้าง
- `web/` = Next.js 16 (App Router) รวม q1/q2/q3 + landing + `/api-docs` (Swagger) → deploy Vercel
- DB = Turso (libSQL), env ที่ `web/.env` (`bun --env-file=.env`), seed: `bun --env-file=.env db/seed.mjs`
- `q1/ q2/ q3/output/` = static deliverables เดิม (ส่ง exam แยกข้อ)

## q3 scrape (สำคัญ)
- Google Maps **headless ส่ง lite DOM** (ได้แค่ rating, ไม่มี reviews/price/aria) → scrape ผ่าน `scripts/scrape.mjs` ตรงๆ ไม่ได้ผลเต็ม
- ต้อง scrape ผ่าน **MCP playwright browser** (render เต็ม: aria `"4.9 ดาว 3,473 รีวิว"` + `฿200-400`) แล้ว merge → `data/raw_maps.json`
- พื้นที่ใช้ได้ **5 เท่านั้น** (โจทย์ห้ามนอกนี้): สยาม · อารีย์ · ทองหล่อ · อโศก · พร้อมพงษ์
- OSM Overpass rate-limit ถ้ายิงเร็ว → ตอบ XML (ต้อง guard + delay)
