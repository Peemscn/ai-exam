# Prompt Log — AI Feedback Classifier

**AI ที่ใช้:** Claude Opus 4.8 (ผ่าน Claude Code — agentic workflow)
**แนวทาง:** ใช้ AI อ่าน feedback ทั้ง 300 รายการ → จับเป็น canonical intents → ตีความ sentiment/category/priority/owner ตามความหมาย → encode เป็น deterministic rules เพื่อความ consistent + reproducible
แต่ละ prompt ด้านล่างคือ prompt ที่ใช้จริง พร้อมคำอธิบายว่าใช้ทำอะไร และ **reusable prompt template** ที่นำไปรันซ้ำกับ ChatGPT/Claude/Gemini ได้ผลเดียวกัน

---

## Prompt 1 — Data Exploration & Intent Discovery
**ใช้ทำอะไร:** ให้ AI อ่าน dataset ทั้งหมด หา pattern/โครงสร้าง ก่อนวางระบบ classify (ไม่เดาจากตัวอย่างไม่กี่อัน)

```
นี่คือ player feedback 300 รายการ (คอลัมน์: feedback_id, date, source, player_id,
player_segment, platform, game_version, game_area_hint, player_feedback)
ช่วยอ่านทั้งหมดแล้วบอก:
1. โครงสร้างข้อความ — มี pattern ซ้ำ / template หรือไม่
2. มี filler หรือ noise (คำขึ้นต้น/ลงท้ายที่ไม่ใช่เนื้อหา) ที่ต้องตัดก่อนวิเคราะห์ไหม
3. จัดกลุ่มเป็น "intent หลัก" ได้กี่แบบ แต่ละแบบสื่อปัญหา/ความเห็นอะไร
```
**ผลลัพธ์:** พบว่าข้อความเป็น template — core message ~65 แบบ + สุ่ม prefix (`อยากฝากทีมงานว่า`, `เจอบ่อยมากว่า`, `ส่วนตัวคิดว่า`) + suffix (`ขอบคุณครับ/ค่ะ`, `รบกวนช่วยดูให้หน่อย`, `ถ้าแก้ได้จะดีมาก`, `เพราะกระทบการเล่นพอสมควร`). suffix บางอันขัดกับ sentiment ของ core (เช่น คำชม + "รบกวนช่วยดู") → ต้องจับ core ไม่ใช่ keyword

---

## Prompt 2 — Classification Rubric (System Prompt)
**ใช้ทำอะไร:** กำหนดกติกาการจัดหมวด/อารมณ์/ความสำคัญ ให้ AI จัดอย่าง **สม่ำเสมอ**ทุกรายการ (หัวใจของความ consistent)

```
คุณเป็นนักวิเคราะห์ player feedback ของเกม จัดประเภท feedback แต่ละรายการตามกติกานี้:

[ขั้นที่ 1 — ตัด filler] ตัดคำขึ้นต้น/ลงท้ายที่เป็น template ออกก่อน เหลือ "core message"
  prefix: "อยากฝากทีมงานว่า" / "เจอบ่อยมากว่า" / "ส่วนตัวคิดว่า"
  suffix: "ขอบคุณครับ/ค่ะ" / "รบกวนช่วยดูให้หน่อย" / "ถ้าแก้ได้จะดีมาก" / "เพราะกระทบการเล่นพอสมควร"
  *** ตัดสิน sentiment จาก core เท่านั้น — suffix "ขอให้แก้" ที่ต่อท้ายคำชม = template noise ไม่ใช่ความไม่พอใจ ***

[ขั้นที่ 2 — sentiment] Positive (ชมล้วน) / Negative (บ่น/ปัญหา) / Neutral (ผสมชม+ติ, ขอ feature, รายงานเฉยๆ)

[ขั้นที่ 3 — category] เลือก 1 หมวดจาก 9 หมวด (+ Other ถ้าไม่เข้าเลย):
  Bug / Technical Issue · Reward / Economy · Gameplay / Balance · Event Feedback
  Gacha / Monetization · UX / UI · Content Request · Positive Feedback · Account / Payment

[ขั้นที่ 4 — priority] เริ่มจากความรุนแรงของปัญหา:
  High = บล็อกการเล่น/บัญชี (crash, login ไม่ได้, ของหาย), กระทบ core combat, P2W รุนแรง
  Medium = ปัญหา balance/event/economy/UX ทั่วไป
  Low = คำชม, feature request, nitpick
  จากนั้นปรับตาม player_segment:
    • Whale / Guild Leader บ่นเรื่องรายได้ (Gacha/Economy) → +1 ระดับ (กระทบ revenue)
    • New / Returning เจอปัญหา onboarding/retention → +1 ระดับ (เสี่ยง churn)
    • Account / Payment → High เสมอ

[ขั้นที่ 5 — suggested_owner] Game Design / Game Economy / Live Ops / QA / Monetization / Product / Community / Customer Support

[ขั้นที่ 6 — confidence] High (core ชัด) / Medium (ผสม/กำกวม) / Low (core เป็นคำชมแต่ template ใส่ suffix ขอแก้ → ต้องให้คนตรวจ)
```
**คำอธิบาย:** prompt นี้คือสิ่งที่ทำให้ผลลัพธ์ **ทำซ้ำได้และเทียบกันได้** — ทุกรายการผ่านกติกาเดียวกัน ไม่ขึ้นกับอารมณ์ตอนจัด. เรา encode กติกานี้เป็นโค้ด (`classify.py`) เพื่อรันกับ 300 รายการแบบ deterministic

---

## Prompt 3 — Per-Row Classification (Reusable Template)
**ใช้ทำอะไร:** เวอร์ชันสำหรับจัดทีละรายการด้วย LLM (ถ้าจะรันกับ ChatGPT/Claude API แทน rule). ใส่ rubric จาก Prompt 2 เป็น system แล้วป้อน:

```
จัดประเภท feedback นี้ ตอบเป็น JSON เท่านั้น:
{"sentiment":"", "category":"", "priority":"", "ai_summary":"<สรุปไทย 1 ประโยค>",
 "suggested_owner":"", "confidence":"", "review_note":"<เหตุผล + การปรับ priority>"}

feedback_id: {id}
player_segment: {segment}
game_area_hint: {hint}
player_feedback: "{text}"
```
**คำอธิบาย:** บังคับ output เป็น JSON เพื่อ parse กลับเข้า sheet ได้อัตโนมัติ + มี `review_note` บังคับให้ AI อธิบายเหตุผล (auditable)

---

## Prompt 4 — Summarization
**ใช้ทำอะไร:** สรุป feedback แต่ละรายการเป็น 1 ประโยคไทยที่อ่านรวมในตารางได้ (ฝังใน Prompt 3 field `ai_summary`)

```
สรุป core message เป็นประโยคไทยเดียว กระชับ เป็นกลาง ไม่เกิน ~20 คำ
ตัด filler ออก เก็บเฉพาะประเด็นจริง (เช่น "เปิดกาชาหลายสิบโรลไม่ได้ rate up รู้สึกท้อ")
```

---

## Prompt 5 — Insight Generation
**ใช้ทำอะไร:** ยกระดับจาก "นับ" เป็น "insight" — หา pattern, risk, trend (ตัวเลขคำนวณด้วย `insights.py` แล้วให้ AI ตีความ)

```
จากผล classification 300 รายการ + cross-tab เหล่านี้ (sentiment%, category, priority,
segment×sentiment, version trend, platform×bug, revenue/retention risk)
ช่วยสรุปเชิง insight ไม่ใช่แค่ตัวเลข:
1. Top 5 issues ที่ควรกังวลสุด + เหตุผลว่าทำไมสำคัญ
2. Pattern เด่น (หมวดไหนครองปัญหา, กลุ่มไหนไม่พอใจสุด, มี regression ตามเวอร์ชันไหม)
3. Risk เชิง revenue และ retention
4. Recommended actions แยกตามทีม
```
**ผลลัพธ์:** ได้ insight เช่น "Gameplay/Balance ครอง 4/5 top issues", "v1.9 regression (neg 63%→78%)", "Light Spender/F2P ไม่พอใจสูงสุด 83% เสี่ยงหลุดก่อน convert", "iOS เป็น bug hotspot"

---

## หมายเหตุเรื่อง Prompt Log แบบเต็ม
Workflow นี้ทำผ่าน **Claude Code** (agentic) โดยผู้จัดทำสั่งงานเป็นภาษาไทยตามธรรมชาติ
(เช่น "อ่าน dataset แล้ว design วิธี classify", "weight ตาม player_segment ด้วย", "ทำ report เป็น HTML")
Prompt 1–5 ด้านบนคือ prompt ที่ตกผลึกเป็นระบบและ **นำไปรันซ้ำได้เอง** ไม่ผูกกับ session
บทสนทนาเต็มกับ AI แนบเพิ่มแยก (ตาม requirement "prompt history เต็ม")
