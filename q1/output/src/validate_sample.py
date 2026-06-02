# -*- coding: utf-8 -*-
"""สุ่มตัวอย่าง 30 รายการ (10%) สำหรับ Human Review — stratified
   รวม low-confidence ทั้งหมด + สุ่มคละ category. seed คงที่ -> reproducible
"""
import json, random
from collections import defaultdict
raw={r["feedback_id"]:r for r in json.load(open("q1/output/data/feedback_raw.json",encoding="utf-8"))}
rows=[]
for line in open("q1/output/data/classified.jsonl",encoding="utf-8"):
    c=json.loads(line); c.update(raw[c["feedback_id"]]); rows.append(c)

random.seed(42)
low=[r for r in rows if r["confidence"]=="Low"]            # ตรวจ low-confidence ทุกตัว
rest=[r for r in rows if r["confidence"]!="Low"]
# stratified สุ่มจากที่เหลือให้คละ category
by_cat=defaultdict(list)
for r in rest: by_cat[r["category"]].append(r)
picked=list(low)
need=30-len(picked)
cats=list(by_cat); i=0
while need>0:
    c=cats[i%len(cats)]
    if by_cat[c]:
        picked.append(by_cat[c].pop(random.randrange(len(by_cat[c])))); need-=1
    i+=1
picked=sorted(picked,key=lambda x:int(x["feedback_id"].split("-")[1]))
print(f"sample = {len(picked)} ({len(low)} low-conf + {len(picked)-len(low)} stratified)\n")
for r in picked:
    print(f'{r["feedback_id"]} | {r["player_segment"]:16} | {r["confidence"]:6} | {r["sentiment"]:8} | {r["category"]:22} | {r["priority"]:6} | {r["suggested_owner"]}')
    print(f'   RAW: {r["player_feedback"]}')
    print(f'   →    {r["ai_summary"]}  [note: {r["review_note"]}]\n')
# เก็บ id list ไว้ทำตาราง
json.dump([r["feedback_id"] for r in picked],open("q1/output/data/_sample_ids.json","w"))
