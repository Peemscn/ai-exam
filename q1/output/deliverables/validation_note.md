# Validation / Human Review Note

**งาน:** AI Feedback Classifier — ตรวจสอบความถูกต้องของผล AI classification
**วิธีสุ่ม:** Stratified sample 30 รายการ (10% ของ 300) — `validate_sample.py`, `random.seed(42)` → reproducible
ประกอบด้วย **low-confidence ทั้งหมด 12 รายการ** (ตรวจทุกตัวที่ AI ไม่มั่นใจ) + สุ่มคละ category อีก 18 รายการ
**ผู้ตรวจ:** ผู้จัดทำ (human review รายข้อความ เทียบ AI label กับการตีความของคน)

---

## 1. ผลการตรวจรายรายการ (30 รายการ)

เกณฑ์ verdict: **✅ Agree** = เห็นด้วยทั้ง sentiment/category/priority · **🟡 Agree (borderline)** = label ถูกแต่ priority ตัดสินได้ 2 ทาง

| # | feedback_id | Segment | AI: Sentiment / Category / Priority | Verdict | หมายเหตุผู้ตรวจ |
|---|---|---|---|---|---|
| 1 | FB-004 | Light Spender | Positive / Positive / Low | ✅ | core ชม "ชอบตัวละครใหม่" — suffix "เพราะกระทบการเล่น" เป็น template noise, AI ตัดถูก |
| 2 | FB-008 | Guild Leader | Negative / Gameplay-Balance / High | ✅ | auto-battle AI — core combat |
| 3 | FB-009 | F2P | Positive / Positive / Low | ✅ | ชมภาพสวย แม้ลงท้าย "รบกวนช่วยดู" — AI จับ core ถูก |
| 4 | FB-016 | Guild Leader | Positive / Positive / Low | ✅ | ชม UI |
| 5 | FB-027 | Guild Leader | Negative / Event / Medium | 🟡 | ถูก; Guild Leader เป็น influencer อาจมองเป็น High เชิง community — ยืนยัน Medium (ปัญหา event ทั่วไป) |
| 6 | FB-028 | Light Spender | Negative / Account-Payment / High | ✅ | login ไม่ได้ = บล็อกการเข้าเกม, ดันเป็น High ถูกต้อง |
| 7 | FB-030 | Casual | Negative / Reward-Economy / Medium | ✅ | ของปลุกพลังหายาก |
| 8 | FB-032 | Guild Leader | Negative / Bug / Medium | ✅ | เสียง effect หาย ต้อง restart |
| 9 | FB-041 | Returning | Positive / Positive / Low | ✅ | ชม mini game |
| 10 | FB-049 | New | Positive / Positive / Low | ✅ | ชม mini game (suffix noise) |
| 11 | FB-061 | Whale | Negative / Gacha-Monetization / High | ✅ | แพ็กแพง + **Whale → +1 priority** (revenue weight ทำงานถูก) |
| 12 | FB-075 | Whale | Positive / Positive / Low | ✅ | ชมภาพสวย (suffix "ถ้าแก้ได้จะดีมาก" = noise) |
| 13 | FB-076 | Light Spender | Positive / Positive / Low | ✅ | ชม UI |
| 14 | FB-082 | Returning | Negative / Bug / High | ✅ | lag ด่านบอส กระทบ gameplay |
| 15 | FB-104 | Casual | Negative / UX-UI / Medium | ✅ | ปุ่ม back พาออกหน้าแรก |
| 16 | FB-146 | Mid Spender | Positive / Positive / Low | ✅ | ชม UI (suffix noise) |
| 17 | FB-152 | Returning | Negative / Reward-Economy / Low | 🟡 | ถูก; login reward ธรรมดา = nitpick → Low เหมาะ แต่ถ้า Returning บ่นซ้ำควรเฝ้าระวัง retention |
| 18 | FB-158 | Returning | Positive / Positive / Low | ✅ | ชม mini game |
| 19 | FB-183 | Returning | Negative / Account-Payment / High | ✅ | login ไม่ได้ |
| 20 | FB-207 | Mid Spender | Positive / Positive / Low | ✅ | ชมทีม support ตอบเร็ว — Positive ถูก (ไม่ใช่ complaint) |
| 21 | FB-209 | Guild Leader | Negative / UX-UI / Medium | ✅ | หน้าจอ layout เพี้ยน |
| 22 | FB-217 | Light Spender | Positive / Positive / Low | ✅ | ชม UI (suffix noise) |
| 23 | FB-224 | New | Neutral / Content Request / Low | ✅ | ขอ guild boss = feature request |
| 24 | FB-225 | Mid Spender | Negative / Gameplay-Balance / Medium | ✅ | ด่านยากมือใหม่ |
| 25 | FB-228 | Whale | Negative / Event / Medium | ✅ | event grind; Whale แต่ไม่ใช่ revenue → ไม่ bump (ถูกตาม rule) |
| 26 | FB-234 | Returning | Positive / Positive / Low | ✅ | ชม mini game |
| 27 | FB-237 | Whale | Positive / Positive / Low | ✅ | ชมภาพสวย (suffix noise) |
| 28 | FB-257 | Whale | Negative / Gacha-Monetization / High | ✅ | แพ็กแพง + Whale weight |
| 29 | FB-280 | F2P | Positive / Positive / Low | ✅ | ชม mini game |
| 30 | FB-291 | Returning | Neutral / Content Request / Low | ✅ | ขอ stat compare = feature request |

---

## 2. สรุปผล

| ตัวชี้วัด | ผล |
|---|---|
| Sentiment ถูกต้อง | **30 / 30 (100%)** |
| Category ถูกต้อง | **30 / 30 (100%)** |
| Priority เห็นด้วยเต็มที่ | 28 / 30 (93%) |
| Priority borderline (ถูกแต่ตัดสินได้ 2 ทาง) | 2 / 30 (FB-027, FB-152) |
| **Low-confidence 12 ตัว ตรวจแล้วถูกทั้งหมด** | **12 / 12** |

**จุดแข็งที่ยืนยันได้:**
- AI **จับ core message ถูกแม้มี filler รบกวน** — กลุ่ม Positive 12 รายการที่ template สุ่ม suffix "รบกวนช่วยดู / ถ้าแก้ได้จะดีมาก" มาต่อท้ายคำชม AI ไม่หลงจัดเป็น Negative (ถ้าใช้ keyword ล้วนจะพลาดทั้งหมด)
- **Segment weighting ทำงานถูก** — Whale บ่นเรื่องเติมเงิน (FB-061, FB-257) ถูกดันเป็น High; Whale บ่นเรื่อง event (FB-228) ไม่ถูก bump เพราะไม่ใช่หมวดรายได้
- Account/Payment (login ไม่ได้) ถูกจัด High ทุกครั้ง

---

## 3. ข้อจำกัด (Limitations) — สำคัญ

1. **Self-review bias:** ผู้ตรวจคือผู้ออกแบบ rule เอง → มีแนวโน้มเห็นด้วยกับผลตัวเอง. ในงานจริงควรให้ **ผู้ตรวจคนที่ 2** ที่ไม่รู้ rule มา review ซ้ำเพื่อวัด inter-rater agreement
2. **Dataset เป็น template-based:** feedback สร้างจาก ~65 core message ที่ซ้ำกัน ทำให้ rule-based classifier ครอบคลุมได้ 100% (unmatched = 0). **ข้อมูลจริงจะหลากหลายกว่ามาก** — ข้อความที่ไม่เคยเห็นจะตกหมวด "Other" และต้องให้คนตรวจ หรือต้องขยาย intent / เปลี่ยนไปใช้ LLM-per-row
3. **Sarcasm / ประชด:** เช่น "ดีมากเลยนะ (ประชด)" — rule และ AI อาจตีความ sentiment ผิด. ใน dataset นี้ไม่พบ แต่เป็นความเสี่ยงจริง
4. **ภาษากำกวมหลายนัย:** เช่น "หนัก" (= grind น่าเบื่อ หรือ ท้าทายแบบที่ชอบ) — ต้องอาศัย context
5. **ไม่มีข้อมูล quantitative** (เวลาเล่น, ยอดเติมเงินจริง) → priority weighting อิง player_segment เป็น proxy ของมูลค่าผู้เล่น ไม่ใช่มูลค่าจริงรายคน
6. **Mixed feedback (ชม+ติ)** ถูกบังคับเป็น Neutral 1 หมวด → เสีย nuance (เช่น "ชมธีม + ติภารกิจซ้ำ" ควรนับเป็นทั้ง Positive-theme และ Negative-issue) งานจริงอาจต้อง multi-label

---

## 4. ข้อเสนอเพื่อลดความผิดพลาด (production)
- ผู้ตรวจคนที่ 2 + วัด agreement (Cohen's kappa)
- ตั้ง threshold: ทุก row ที่ confidence = Low ส่งเข้า human queue เสมอ (ทำแล้ว — flag ตัวหนาแดงใน xlsx)
- Spot-check รายเดือนเมื่อ feedback รูปแบบใหม่เข้ามา + ขยาย intent table
- เก็บ feedback ที่ตก "Other" มา re-train / เพิ่ม rule
