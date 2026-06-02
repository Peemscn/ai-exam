# Prompt Log — Gacha Drop Rate Simulator (q2)

**AI:** Claude Opus 4.8 (ผ่าน Claude Code) · Output: `gacha-simulator.html` ไฟล์เดียว
แต่ละ prompt = prompt ที่ใช้จริง + คำอธิบายว่าใช้ทำอะไร (reusable — รันซ้ำกับ ChatGPT/Claude/Gemini ได้)

---

## Prompt 1 — ตีโจทย์ + ออกแบบสถาปัตยกรรม
**ใช้ทำอะไร:** อ่านโจทย์ครบทุก tab แล้ววางโครงก่อนเขียนโค้ด
```
นี่คือโจทย์ Gacha Drop Rate Simulator (tab: โจทย์หลัก, รายละเอียดงาน, HTML Output, Tech Stack, เกณฑ์ตรวจ)
1. สรุป requirement แยก Must / Advanced / Bonus + map คะแนน
2. ออกแบบ single-file HTML/CSS/JS:
   - state กลาง: rates, pool, pity, history, lastPull, playerResult
   - section: Rate Settings / Item Pool / Single Simulation / Player POV
   - ข้อจำกัด: ทำงานบน file:// (ห้าม fetch/CDN/module), responsive, dark mode
```
**ได้:** architecture + scoring map (core 110 + bonus 20) ก่อนลงมือ

## Prompt 2 — Gacha roll logic (หัวใจ 18 คะแนน)
**ใช้ทำอะไร:** สร้าง logic สุ่มที่ถูกต้อง ตรวจสอบได้ ไม่ hardcode
```
เขียน logic สุ่ม:
- pickRarity(rates, ctx): สุ่มตาม cumulative rate ด้วย Math.random() (ผลเปลี่ยนทุกครั้ง)
- pity: ถ้าเปิด + counter+1 ถึง threshold → การันตี SSR แล้ว reset; SSR ปกติ reset, rarity อื่น counter++
- rollOnce: pickRarity → สุ่ม item ใน rarity นั้นจาก pool (ถ้า pool ว่าง = invalid)
แยก pity context: single sim ใช้ state ต่อเนื่อง / Monte Carlo สร้าง ctx ใหม่ต่อรอบจำลอง
```

## Prompt 3 — Player POV + Monte Carlo (15 คะแนน)
**ใช้ทำอะไร:** จำลองฝั่งผู้เล่นว่าเติมงบเท่านี้ได้ SSR แค่ไหน
```
- computeRolls: paid = floor(budget/price); free roll rule "ครบ X paid → ฟรี Y" = floor(paid/X)*Y
  (free roll ไม่สร้าง free roll ซ้ำ — คิดจาก paid เท่านั้น); total = paid + free
- runMC(sims): แต่ละรอบจำลอง total rolls นับ SSR → aggregate:
  chance ได้ SSR ≥ 1, chance ได้ 0, average, best, worst + histogram (0/1/2/3/4+ SSR)
- insight: สรุปเป็นภาษาคน เช่น "เติม 3,000 บาท (110 rolls) โอกาสได้ SSR อย่างน้อย 1 = 100%"
```

## Prompt 4 — UI/UX + chart + responsive/dark
```
UI clean: rate box สีตาม rarity, item table + chips, result stat cards,
CSS bar chart (วาดเอง ไม่ใช้ library), dark mode (CSS variables + toggle + localStorage persist),
responsive (rate 2-col บนมือถือ, cards auto-fit), micro-interaction (bar animate, fade-in), empty state
```

## Prompt 5 — Validation + CSV export
```
Validation: rate รวมต้อง = 100% (badge เขียว/แดง + block สุ่ม), ทุก rarity ที่ rate>0 ต้องมี item,
input ห้ามติดลบ, simulation cap. 
CSV: Blob + URL.createObjectURL + download attribute (ทำงานบน file://),
export latest pull (roll/rarity/item/cost) + Player POV summary, ใส่ BOM ให้ Excel อ่านไทยถูก
```

---
**หมายเหตุ:** ทำผ่าน Claude Code โดยสั่งเป็นภาษาไทยตามธรรมชาติ + verify ทุก feature ในเบราว์เซอร์จริง (สุ่ม, Monte Carlo, pity, validation, dark, mobile). แนบ chat log เต็มประกอบเป็น prompt history
