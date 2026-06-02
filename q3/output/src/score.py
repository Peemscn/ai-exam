# -*- coding: utf-8 -*-
"""Scoring Model 100 คะแนน (น้ำหนักตามโจทย์ q3)
   Rating&Review 25 · Group 20 · Price 15 · Travel 15 · DataComplete 15 · Uniqueness 10
   สูตรโปร่งใส อธิบายได้ (deterministic) — context: เลือกร้านมื้อเย็นทีม 8-12 คน ย่านอโศก
"""
import json, math
D="q3/output/data"
clean=json.load(open(f"{D}/clean.json",encoding="utf-8"))

GROUP_GOOD=["ภัตตาคาร","ปิ้งย่าง","ยากินิกุ","บุฟเฟ","อาหารทะเล","สเต็ก","ไทย","อิตาลี","อินเดีย","จีน","ร้านอาหาร","บาร์","ห้องอาหาร","เลบานอน","ตะวันตก","เม็กซิ","ราเมน","อิซาคายะ","ชาบู","เกาหลี"]
GROUP_WEAK=["คาเฟ่","กาแฟ","เบเกอรี","ขนม","จานด่วน","แซนด์วิช","ก๋วยเตี๋ยว","ศูนย์อาหาร","ไอศกรีม","แฮมเบอร์เกอร์","พิซซ่า"]
UNIQUE_KW=["rooftop","บาร์","ปิ้งย่าง","ยากินิกุ","เลบานอน","เม็กซิ","อินเดีย","ราเมน","สเต็ก","อิซาคายะ","หูฉลาม","ทะเล","เกาหลี","บิสโทร"]

def s_rating_review(r):   # /25 = คุณภาพ rating (/15) + ความน่าเชื่อจากจำนวนรีวิว (/10)
    rr=max(0,(r["rating"]-3.5)/1.5)*15
    rv=min(10, math.log10(r["reviews"]+1)/math.log10(25000)*10)
    return round(min(25,rr+rv),1)
def s_group(r):           # /20 = ประเภทร้านเหมาะกลุ่ม + ความนิยม (รับกลุ่มใหญ่ได้)
    c=r["category"] or ""; base=10
    if any(g in c for g in GROUP_GOOD): base=16
    if any(w in c for w in GROUP_WEAK): base=7
    return round(min(20, base+min(4, r["reviews"]/2500)),1)
def s_price(r):           # /15 = เหมาะงบมื้อเย็นทีม (~250-700/คน)
    lo,hi=r.get("price_min"),r.get("price_max")
    if lo is None: return 7
    mid=(lo+(hi or lo))/2
    if 200<=mid<=700: return 15
    if mid<200: return 10
    if mid<=1200: return 12
    if mid<=2000: return 8
    return 5
def s_travel(r):          # /15 = ระยะจาก Asok BTS/MRT
    d=r.get("distance_m")
    if d is None: return 7
    return 15 if d<=300 else 12 if d<=600 else 9 if d<=900 else 6 if d<=1200 else 3
def s_data(r):            # /15 = ความครบของข้อมูล
    fields=[r.get("address"),r.get("hours"),r.get("website"),r.get("cuisine_osm"),r.get("lat"),r.get("category")]
    return round(sum(1 for f in fields if f)/len(fields)*15,1)
def s_unique(r):          # /10 = ความพิเศษ/ประสบการณ์
    c=(r["category"] or "").lower(); sc=4
    if r["rating"]>=4.7: sc+=3
    if any(k in c for k in UNIQUE_KW): sc+=3
    return min(10,sc)

for r in clean:
    sub={"rating_review":s_rating_review(r),"group_suitability":s_group(r),"price_suitability":s_price(r),
         "travel_convenience":s_travel(r),"data_completeness":s_data(r),"uniqueness":s_unique(r)}
    r["scores"]=sub; r["total"]=round(sum(sub.values()),1)
clean.sort(key=lambda x:(-x["total"],-x["reviews"]))
for i,r in enumerate(clean,1): r["rank"]=i
json.dump(clean,open(f"{D}/scored.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print(f"scored {len(clean)} ร้าน · TOP 10:")
print(f"{'#':>2} {'ชื่อ':32} {'รวม':>5} | R&R  Grp  Prc  Trv  Dat  Uniq | rating(rev) dist")
for r in clean[:10]:
    s=r["scores"]
    print(f"{r['rank']:>2} {r['name'][:32]:32} {r['total']:>5} | {s['rating_review']:>4} {s['group_suitability']:>4} {s['price_suitability']:>4} {s['travel_convenience']:>4} {s['data_completeness']:>4} {s['uniqueness']:>4} | {r['rating']}★({r['reviews']}) {r['distance_m']}m")
