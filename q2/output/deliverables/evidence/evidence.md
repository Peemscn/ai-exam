# Evidence — q2 Gacha Drop Rate Simulator

## Tools ที่ใช้
| Tool | ใช้ทำอะไร |
|---|---|
| **Claude Opus 4.8** (Claude Code) | ออกแบบ logic/UI, เขียน `gacha-simulator.html`, unit test |
| Vanilla HTML/CSS/JS (ไฟล์เดียว) | simulator — ไม่ build/framework/CDN, เปิด `file://` ได้ |
| **node:test / bun test** | unit test ตรรกะ (rate, distribution, free-roll, pity, validation) |
| Playwright | verify ในเบราว์เซอร์ตอนพัฒนา (สุ่ม/Monte Carlo/validation/responsive/dark) |

## หลักฐาน
1. **`evidence-claude-code-1..3.png`** (โฟลเดอร์นี้) — screenshot Claude Code session
2. **`../gacha-simulator.html`** — ผลงาน เปิดเบราว์เซอร์ได้ทันที
3. **`../../tests/`** (`gacha-logic.mjs` + `gacha.test.mjs`) — unit test **12/12** ผ่านทั้ง node และ bun

## วิธีรัน / ทำซ้ำ
```
# เปิด simulator: double-click ../gacha-simulator.html
node --test q2/output/tests/gacha.test.mjs      # zero-dep
bun  test    q2/output/tests/gacha.test.mjs      # เร็วกว่า
```
> หลักฐานหลัก: chat log เต็มของ session Claude Code
