# -*- coding: utf-8 -*-
"""
AI Feedback Classifier — q1
Approach: Claude (Opus 4.8) อ่าน feedback ทั้ง 300 รายการ, จับเป็น canonical intents,
ตีความ sentiment/category/priority/owner ของแต่ละ intent ตามวิจารณญาณเชิงความหมาย,
แล้ว encode เป็น deterministic rules เพื่อความ consistent + reproducible + auditable.
Priority ปรับตาม player_segment (revenue/retention weighting).

Input : feedback_raw.json (300 records)
Output: classified.jsonl (1 record/line) + สรุป distribution ทาง stdout
"""
import json, re, sys
from collections import Counter

RAW = "q1/output/data/feedback_raw.json"
OUT = "q1/output/data/classified.jsonl"

# ---- filler ที่ template สุ่มมาเติม (ไม่ใช่เนื้อความจริง) ----
PREFIXES = ["อยากฝากทีมงานว่า", "เจอบ่อยมากว่า", "ส่วนตัวคิดว่า"]
# suffix 2 กลุ่ม: สุภาพ (ไม่ขัด sentiment) vs ขอให้แก้ (ขัดกับคำชม)
SUFFIX_POLITE = ["ขอบคุณครับ/ค่ะ", "ขอบคุณมาก"]
SUFFIX_FIX    = ["รบกวนช่วยดูให้หน่อย", "ถ้าแก้ได้จะดีมาก", "เพราะกระทบการเล่นพอสมควร"]

def strip_filler(text):
    """ตัด prefix/suffix filler ออก เหลือ core message. คืน (core, polite?, askfix?)"""
    t = text.strip()
    polite = askfix = False
    changed = True
    while changed:
        changed = False
        for p in PREFIXES:
            if t.startswith(p):
                t = t[len(p):].strip(); changed = True
        for s in SUFFIX_POLITE:
            if t.endswith(s):
                t = t[:-len(s)].strip(); polite = True; changed = True
        for s in SUFFIX_FIX:
            if t.endswith(s):
                t = t[:-len(s)].strip(); askfix = True; changed = True
    return t, polite, askfix

# ---- Canonical intents: (keys, category, sentiment, base_priority, owner, tags, summary) ----
# tags: revenue=กระทบรายได้, retention=กระทบ churn, crash/payment=บล็อกการเล่น/บัญชี, mixed=ชม+ติ, onboarding=มือใหม่
C_GACHA="Gacha / Monetization"; C_ECON="Reward / Economy"; C_BAL="Gameplay / Balance"
C_BUG="Bug / Technical Issue"; C_UX="UX / UI"; C_REQ="Content Request"
C_EVENT="Event Feedback"; C_POS="Positive Feedback"; C_ACC="Account / Payment"

T = lambda k,cat,sent,prio,owner,tags,summ: dict(k=k,cat=cat,sent=sent,prio=prio,owner=owner,tags=tags,sum=summ)
THEMES = [
  # --- Gacha / Monetization ---
  T(["ยังไม่ได้ตัว rate up","rate up รู้สึกท้อ"],C_GACHA,"Negative","High","Monetization",["revenue","retention"],"เปิดกาชาหลายสิบโรลแล้วยังไม่ได้ตัว rate up รู้สึกท้อ"),
  T(["pity ชัดเจนกว่านี้","อ่านเงื่อนไขแล้วงง"],C_GACHA,"Negative","Medium","Monetization",["revenue"],"ผู้เล่นอยากให้ระบบ pity ชัดเจนกว่านี้ ตอนนี้อ่านเงื่อนไขแล้วงง"),
  T(["แพ็กเกจเติมเงินราคาสูง"],C_GACHA,"Negative","Medium","Monetization",["revenue"],"แพ็กเกจเติมเงินราคาสูงไปเมื่อเทียบกับจำนวนเพชรที่ได้"),
  T(["ได้ตัวซ้ำบ่อยมาก"],C_GACHA,"Negative","Medium","Monetization",["revenue"],"ได้ตัวซ้ำบ่อย แต่ระบบแลกชิ้นส่วนยังไม่คุ้ม"),
  T(["Banner ใหม่ออกถี่"],C_GACHA,"Negative","Medium","Monetization",["revenue"],"Banner ใหม่ออกถี่เกินไป เก็บเพชรไม่ทัน"),
  T(["preview animation","ทดลองใช้ตัวละครก่อนเปิดกาชา"],C_REQ,"Neutral","Low","Product",[],"ขอ preview/ทดลองตัวละครก่อนเปิดกาชา"),
  T(["pay to win"],C_GACHA,"Negative","High","Monetization",["revenue","retention"],"ผู้เล่นรู้สึกว่าเกม pay to win มากขึ้นหลังอัปเดต"),
  T(["skin ฟรีจาก event"],C_REQ,"Neutral","Low","Live Ops",[],"อยากได้ skin ฟรีจาก event ไม่ใช่มีแต่ขายใน shop"),
  # --- Reward / Economy ---
  T(["เควสต์รายสัปดาห์ให้แต้มไม่พอ"],C_ECON,"Negative","Medium","Game Economy",["revenue"],"เควสต์รายสัปดาห์ให้แต้มไม่พอแลกของหลัก"),
  T(["ของรางวัลรายวันน้อยไป"],C_ECON,"Negative","Medium","Game Economy",["revenue"],"ของรางวัลรายวันน้อยเมื่อเทียบกับเวลาที่ต้องเล่น"),
  T(["ทองในเกมขาดตลอด"],C_ECON,"Negative","Medium","Game Economy",["revenue"],"ทองในเกมขาดตลอด อัปเกรดตัวละครแทบไม่พอ"),
  T(["ปลุกพลังหายากเกินไป"],C_ECON,"Negative","Medium","Game Economy",["revenue"],"ของปลุกพลังหายาก ฟาร์มทั้งวันยังไม่พอ"),
  T(["ไม่เติมเงินแทบตามคนอื่นไม่ทัน"],C_ECON,"Negative","High","Game Economy",["revenue","retention"],"ถ้าไม่เติมเงินแทบตามคนอื่นไม่ทัน เพราะทรัพยากรแจกน้อย"),
  T(["ราคา item ใน event shop สูง"],C_ECON,"Negative","Medium","Game Economy",["revenue"],"ราคา item ใน event shop สูงไปสำหรับผู้เล่นใหม่"),
  T(["รางวัล login รอบนี้ดูธรรมดา"],C_ECON,"Negative","Low","Game Economy",["revenue"],"รางวัล login ดูธรรมดา อยากให้มีเพชร/ticket เพิ่ม"),
  T(["stamina เยอะ แต่ของแลกในร้านไม่ค่อยคุ้ม"],C_ECON,"Negative","Medium","Game Economy",["revenue"],"กิจกรรมใช้ stamina เยอะ แต่ของแลกในร้านไม่คุ้ม"),
  T(["ใช้ stamina รวมกับด่านปกติ"],C_EVENT,"Negative","Medium","Live Ops",[],"Event ใช้ stamina รวมกับด่านปกติ ทำให้ต้องเลือกฟาร์ม"),
  # --- Gameplay / Balance ---
  T(["one shot บ่อยเกิน"],C_BAL,"Negative","High","Game Design",[],"บอสใหม่มีสกิล one shot บ่อยเกิน รู้สึกไม่แฟร์"),
  T(["auto battle ใช้สกิลแปลก"],C_BAL,"Negative","High","Game Design",[],"auto battle ใช้สกิลแปลก ทำให้แพ้ทั้งที่ power ถึง"),
  T(["ชนะง่ายเกินไปจน meta แคบ"],C_BAL,"Negative","Medium","Game Design",[],"บางทีมใน PvP ชนะง่ายเกินไปจน meta แคบ"),
  T(["พลังที่แนะนำในด่านไม่ตรง"],C_BAL,"Negative","Medium","Game Design",[],"พลังที่แนะนำในด่านไม่ตรงกับความยากจริง"),
  T(["แรงเกินไป เจอใน arena"],C_BAL,"Negative","High","Game Design",[],"ตัวละครบางตัวแรงเกินไป เจอใน arena แทบไม่มีทางสู้"),
  T(["ปรับ balance ของอาวุธ"],C_BAL,"Negative","Medium","Game Design",[],"อยากให้ปรับ balance อาวุธบางชิ้น แรงต่างกันเกิน"),
  T(["ตัวละครสายฮีลดูอ่อน"],C_BAL,"Negative","Medium","Game Design",[],"ตัวละครสายฮีลอ่อนเกินไปเมื่อเทียบกับดาเมจบอส"),
  T(["ยากเกินไปสำหรับคนที่เพิ่งเริ่มเล่น"],C_BAL,"Negative","Medium","Game Design",["retention","onboarding"],"ด่านยากเกินไปสำหรับผู้เล่นใหม่ที่เพิ่งเริ่มไม่ถึงเดือน"),
  # --- Bug / Technical ---
  T(["โหลดแพตช์ช้ามาก"],C_BUG,"Negative","Medium","QA",[],"โหลดแพตช์ช้ามากทั้งที่เน็ตปกติ"),
  T(["เสียงเอฟเฟกต์หาย"],C_BUG,"Negative","Medium","QA",[],"เสียงเอฟเฟกต์หายหลังจบการต่อสู้ ต้อง restart เกม"),
  T(["เกมแลคมากในด่านบอส"],C_BUG,"Negative","High","QA",[],"เกมแลคมากในด่านบอสใหม่ เฟรมตกจนกดหลบไม่ทัน"),
  T(["เกมค้างตอนเข้าหน้า"],C_BUG,"Negative","High","QA",["crash"],"หลังอัปเดตเกมค้างตอนเข้าบางหน้า ต้องปิดเปิดใหม่"),
  T(["เด้งออกบ่อย"],C_BUG,"Negative","High","QA",["crash"],"เข้าเกมกลางคืนแล้วเด้งออกบ่อย โดยเฉพาะตอนเปลี่ยนแผนที่"),
  T(["ของไม่เข้า inventory","loading นานมาก สุดท้ายของไม่เข้า"],C_BUG,"Negative","High","QA",["payment"],"กดรับรางวัลแล้ว loading นาน สุดท้ายของไม่เข้า inventory"),
  T(["แจ้งเตือนเควสต์ขึ้นซ้ำ"],C_BUG,"Negative","Low","QA",[],"ระบบแจ้งเตือนเควสต์ขึ้นซ้ำทั้งที่เคลียร์แล้ว"),
  # --- UX / UI ---
  T(["ตัวหนังสือในหน้ารายละเอียดสกิลเล็ก"],C_UX,"Negative","Medium","Product",[],"ตัวหนังสือหน้ารายละเอียดสกิลเล็ก อ่านยากบนมือถือ"),
  T(["แจ้งเตือนสีแดงเยอะเกินไป"],C_UX,"Negative","Low","Product",[],"แจ้งเตือนสีแดงเยอะเกินไป ไม่รู้ว่าอะไรสำคัญจริง"),
  T(["กรองของได้ไม่ละเอียด"],C_UX,"Negative","Medium","Product",[],"หน้า inventory กรองของไม่ละเอียด หา item ยาก"),
  T(["หาเจอยาก ต้องกดหลายขั้นตอน"],C_UX,"Negative","Medium","Product",[],"บางเมนูหายาก ต้องกดหลายขั้นตอนเกินไป"),
  T(["ปุ่มย้อนกลับบางหน้าพาออกไปหน้าแรก"],C_UX,"Negative","Medium","Product",[],"ปุ่มย้อนกลับบางหน้าพาออกไปหน้าแรก เสียเวลา"),
  T(["แสดงผลเพี้ยน ปุ่มทับกัน"],C_UX,"Negative","Medium","Product",[],"บางหน้าจอแสดงผลเพี้ยน ปุ่มทับกันบนมือถือจอเล็ก"),
  T(["Tutorial ช่วงแรกเร็วไป"],C_UX,"Negative","Medium","Product",["retention","onboarding"],"Tutorial ช่วงแรกเร็วไป อธิบายระบบเยอะจนจำไม่ทัน"),
  T(["หน้า shop อธิบายสิทธิ์ไม่ชัด"],C_UX,"Neutral","Medium","Product",["mixed"],"ชมโปรโมชันรายเดือนคุ้ม แต่หน้า shop อธิบายสิทธิ์ไม่ชัด"),
  # --- Content Request ---
  T(["replay ดูการต่อสู้ย้อนหลัง"],C_REQ,"Neutral","Low","Product",[],"ขอระบบ replay ดูการต่อสู้ย้อนหลัง"),
  T(["guild boss"],C_REQ,"Neutral","Low","Game Design",[],"ขอระบบ guild boss ให้ช่วยกันตี"),
  T(["ตัวละครสายซัพพอร์ตใหม่"],C_REQ,"Neutral","Low","Game Design",[],"ขอตัวละครสายซัพพอร์ตใหม่ ตอนนี้มีแต่สายดาเมจ"),
  T(["ภาษาไทยในเสียงพากย์","subtitle ให้ครบ"],C_REQ,"Neutral","Low","Product",[],"ขอเพิ่มเสียงพากย์ไทยหรืออย่างน้อย subtitle ให้ครบ"),
  T(["เนื้อเรื่อง event สนุก"],C_REQ,"Neutral","Low","Product",["mixed"],"ชมเนื้อเรื่อง event สนุก แต่อยากให้มีเสียงพากย์เพิ่ม"),
  T(["claim all"],C_REQ,"Neutral","Low","Product",[],"ขอปุ่ม claim all สำหรับของรางวัลหลายรายการ"),
  T(["ปฏิทิน event ล่วงหน้า"],C_REQ,"Neutral","Low","Live Ops",[],"ขอปฏิทิน event ล่วงหน้าเพื่อวางแผนใช้ทรัพยากร"),
  T(["preset ทีมหลายชุด"],C_REQ,"Neutral","Low","Product",[],"ขอ preset ทีมหลายชุดเพื่อสลับลงด่านง่ายขึ้น"),
  T(["stat เปรียบเทียบก่อนและหลังเปลี่ยนอุปกรณ์"],C_REQ,"Neutral","Low","Product",[],"ขอดู stat เปรียบเทียบก่อน/หลังเปลี่ยนอุปกรณ์"),
  T(["โหมด co-op เล่นกับเพื่อน"],C_REQ,"Neutral","Low","Game Design",[],"ขอโหมด co-op เล่นกับเพื่อนแบบจริงจัง"),
  T(["ช่องทางตรวจประวัติการเติมเงิน"],C_REQ,"Neutral","Medium","Customer Support",["payment"],"ขอช่องทางตรวจประวัติการเติมเงินในเกม"),
  # --- Event Feedback ---
  T(["ธีมน่ารักดี แต่ภารกิจซ้ำ"],C_EVENT,"Neutral","Medium","Live Ops",["mixed"],"ชม event ธีมน่ารัก แต่ติว่าภารกิจซ้ำเยอะ"),
  T(["อันดับ event แข่งขันหนักมาก"],C_EVENT,"Negative","Medium","Live Ops",[],"อันดับ event แข่งขันหนักมาก ผู้เล่นทั่วไปสู้ยาก"),
  T(["บังคับเล่นหลายรอบจนรู้สึก grind"],C_EVENT,"Negative","Medium","Live Ops",[],"ภารกิจ event บังคับเล่นหลายรอบจนรู้สึก grind"),
  T(["เวลาจัด event สั้นเกินไป"],C_EVENT,"Negative","Medium","Live Ops",[],"เวลาจัด event สั้นเกินไป คนทำงานตามเก็บไม่ทัน"),
  # --- Positive ---
  T(["ชอบตัวละครใหม่มาก"],C_POS,"Positive","Low","Community",[],"ชมตัวละครใหม่ ดีไซน์ดีและสกิลสนุก"),
  T(["ภาพสวยขึ้นมาก"],C_POS,"Positive","Low","Community",[],"ชมว่าอัปเดตนี้ภาพสวยขึ้น โดยเฉพาะฉากต่อสู้ใหม่"),
  T(["UI ใหม่ดูสะอาดขึ้น"],C_POS,"Positive","Low","Community",[],"ชม UI ใหม่สะอาดขึ้น เข้าใจง่ายกว่าเดิม"),
  T(["กลับมาเล่นทุกวันอีกครั้ง"],C_POS,"Positive","Low","Community",[],"event ทำให้กลับมาเล่นทุกวันอีกครั้ง"),
  T(["mini game ใน event นี้ เล่นง่าย"],C_POS,"Positive","Low","Community",[],"ชอบ mini game ใน event เล่นง่ายและไม่เครียด"),
  T(["ของแจกครบรอบดีเกินคาด"],C_POS,"Positive","Low","Community",[],"ของแจกครบรอบดีเกินคาด รู้สึกว่าเกมใส่ใจผู้เล่น"),
  T(["เพลงในแผนที่ใหม่ดีมาก"],C_POS,"Positive","Low","Community",[],"ชมเพลงในแผนที่ใหม่ เปิดฟังเพลิน"),
  T(["ทีมงานตอบปัญหาใน community เร็ว"],C_POS,"Positive","Low","Community",[],"ชมทีมงานตอบปัญหาใน community เร็วกว่าที่คิด"),
  # --- Account / Payment ---
  T(["ล็อกอินด้วย Facebook ไม่ได้"],C_ACC,"Negative","High","Customer Support",["payment","crash"],"ล็อกอินด้วย Facebook ไม่ได้ตั้งแต่เมื่อวาน (บล็อกการเข้าเกม)"),
  T(["customer support ขอข้อมูลเยอะมาก"],C_ACC,"Negative","Medium","Customer Support",["payment"],"ระบบ support ขอข้อมูลเยอะแต่ยังไม่ได้คำตอบ"),
]

ORDER={"Low":0,"Medium":1,"High":2}; REV={0:"Low",1:"Medium",2:"High"}
HIGH_VALUE={"Whale","Guild Leader"}; SPENDER={"Mid Spender","Light Spender"}; RETENTION={"New Player","Returning Player"}

def adjust_priority(base, cat, tags, seg, sent):
    """ปรับ priority ตาม player_segment + ความรุนแรงของปัญหา. คืน (priority, note)"""
    if sent=="Positive":
        return "Low", ""
    p=ORDER[base]; notes=[]
    if cat==C_ACC:                       # บัญชี/จ่ายเงินถูกบล็อก = วิกฤตเสมอ
        if p<2: notes.append("Account/Payment = บล็อกการเข้าถึง → ดันเป็น High")
        p=2
    if "revenue" in tags and seg in HIGH_VALUE and p<2:
        notes.append(f"{seg} (กลุ่มจ่ายเงินสูง) บ่นเรื่องรายได้ → +1 priority"); p+=1
    if "retention" in tags and seg in RETENTION and p<2:
        notes.append(f"{seg} (เสี่ยง churn) เจอปัญหา retention → +1 priority"); p+=1
    if "onboarding" in tags and seg=="New Player" and p<2:
        notes.append("New Player เจอปัญหา onboarding → +1 priority"); p+=1
    return REV[min(2,p)], "; ".join(notes)

def classify(rec):
    raw=rec["player_feedback"]
    core,polite,askfix=strip_filler(raw)
    matched=None
    for th in THEMES:
        if any(k in core for k in th["k"]):
            matched=th; break
    if not matched:
        return dict(sentiment="Neutral",category="Other",priority="Low",
                    ai_summary=core[:80],suggested_owner="Triage",confidence="Low",
                    review_note="ไม่ match canonical intent — ต้องให้คนตรวจ",matched_theme="(none)")
    sent=matched["sent"]; prio,bump_note=adjust_priority(matched["prio"],matched["cat"],matched["tags"],rec["player_segment"],sent)
    # confidence
    conf="High"; notes=[]
    if bump_note: notes.append(bump_note)
    if "mixed" in matched["tags"]:
        conf="Medium"; notes.append("feedback ผสมทั้งชมและติ → จัดเป็น Neutral")
    if sent=="Positive" and askfix:      # ชม core แต่ template สุ่ม suffix ขอแก้ → ระวัง
        conf="Low"; notes.append("core เป็นคำชมแต่มี filler ขอให้แก้ (template noise) — ยืนยัน Positive จาก core")
    return dict(sentiment=sent,category=matched["cat"],priority=prio,
                ai_summary=matched["sum"],suggested_owner=matched["owner"],
                confidence=conf,review_note=("; ".join(notes) if notes else "จัดจาก core message ชัดเจน"),
                matched_theme=matched["k"][0])

def main():
    data=json.load(open(RAW,encoding="utf-8"))
    rows=[]
    for rec in data:
        c=classify(rec); c["feedback_id"]=rec["feedback_id"]; rows.append(c)
    with open(OUT,"w",encoding="utf-8") as f:
        for r in rows: f.write(json.dumps(r,ensure_ascii=False)+"\n")
    # ---- distribution report ----
    print("classified:",len(rows),"/ 300")
    unmatched=[r["feedback_id"] for r in rows if r["category"]=="Other"]
    print("unmatched (Other):",len(unmatched),unmatched[:20])
    for field in ("sentiment","category","priority","confidence"):
        print(f"\n[{field}]")
        for k,v in Counter(r[field] for r in rows).most_common():
            print(f"  {k:28} {v:3}  ({v/len(rows)*100:.1f}%)")
    print("\n[suggested_owner]")
    for k,v in Counter(r["suggested_owner"] for r in rows).most_common():
        print(f"  {k:20} {v:3}")
    print("\ndistinct matched themes:",len(set(r["matched_theme"] for r in rows)),"/",len(THEMES))

if __name__=="__main__":
    main()
