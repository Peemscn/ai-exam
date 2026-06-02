# -*- coding: utf-8 -*-
"""Pure logic — mirror ของ clean.py + score.py (สกัดออกมาเพื่อ unit test; keep in sync)"""
import re, math

# ---- clean.py helpers ----
def parse_price(p):
    if not p: return (None,None)
    nums=[int(x.replace(',','')) for x in re.findall(r'[\d,]+',p)]
    if not nums: return (None,None)
    if '+' in p: return (nums[0],None)
    if len(nums)>=2: return (nums[0],nums[1])
    return (nums[0],nums[0])

def coords(u):
    m=re.search(r'!3d([\d.]+)!4d([\d.]+)',u or '')
    return (float(m.group(1)),float(m.group(2))) if m else (None,None)

def haversine(a,b):
    if None in a or None in b: return None
    R=6371000; p1,p2=math.radians(a[0]),math.radians(b[0])
    dlat=math.radians(b[0]-a[0]); dlon=math.radians(b[1]-a[1])
    x=math.sin(dlat/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dlon/2)**2
    return round(R*2*math.asin(math.sqrt(x)))

def norm(s): return re.sub(r'[\s\-_.()&,]+','',(s or '').lower())

def parse_address(meta):
    for m in meta:
        if re.search(r'(เปิดอยู่|ปิดอยู่|ปิดเวลา|เปิดวัน|เปิด 24)',m): continue
        if re.search(r'(ซอย|ซ\.|ถ\.|ถนน|ชั้น|Sukhumvit|floor|Terminal|Rd|Soi|\d{1,4}/)',m):
            parts=[p.strip() for p in m.split('·') if p.strip()]
            for p in reversed(parts):
                if re.search(r'(ซอย|ซ\.|ถ\.|ถนน|ชั้น|Sukhumvit|floor|Terminal|Rd|Soi|\d)',p): return p
    return None

# ---- score.py (น้ำหนัก 25/20/15/15/15/10) ----
GROUP_GOOD=["ภัตตาคาร","ปิ้งย่าง","ยากินิกุ","บุฟเฟ","อาหารทะเล","สเต็ก","ไทย","อิตาลี","อินเดีย","จีน","ร้านอาหาร","บาร์","ห้องอาหาร","เลบานอน","ตะวันตก","เม็กซิ","ราเมน","อิซาคายะ","ชาบู","เกาหลี"]
GROUP_WEAK=["คาเฟ่","กาแฟ","เบเกอรี","ขนม","จานด่วน","แซนด์วิช","ก๋วยเตี๋ยว","ศูนย์อาหาร","ไอศกรีม","แฮมเบอร์เกอร์","พิซซ่า"]
UNIQUE_KW=["rooftop","บาร์","ปิ้งย่าง","ยากินิกุ","เลบานอน","เม็กซิ","อินเดีย","ราเมน","สเต็ก","อิซาคายะ","หูฉลาม","ทะเล","เกาหลี","บิสโทร"]

def s_rating_review(r):
    rr=max(0,(r["rating"]-3.5)/1.5)*15
    rv=min(10, math.log10(r["reviews"]+1)/math.log10(25000)*10)
    return round(min(25,rr+rv),1)
def s_group(r):
    c=r["category"] or ""; base=10
    if any(g in c for g in GROUP_GOOD): base=16
    if any(w in c for w in GROUP_WEAK): base=7
    return round(min(20, base+min(4, r["reviews"]/2500)),1)
def s_price(r):
    lo,hi=r.get("price_min"),r.get("price_max")
    if lo is None: return 7
    mid=(lo+(hi or lo))/2
    if 200<=mid<=700: return 15
    if mid<200: return 10
    if mid<=1200: return 12
    if mid<=2000: return 8
    return 5
def s_travel(r):
    d=r.get("distance_m")
    if d is None: return 7
    return 15 if d<=300 else 12 if d<=600 else 9 if d<=900 else 6 if d<=1200 else 3
def s_data(r):
    f=[r.get("address"),r.get("hours"),r.get("website"),r.get("cuisine_osm"),r.get("lat"),r.get("category")]
    return round(sum(1 for x in f if x)/len(f)*15,1)
def s_unique(r):
    c=(r["category"] or "").lower(); sc=4
    if r["rating"]>=4.7: sc+=3
    if any(k in c for k in UNIQUE_KW): sc+=3
    return min(10,sc)
