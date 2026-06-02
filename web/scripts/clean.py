# -*- coding: utf-8 -*-
"""Merge + clean: raw_maps.json (Google Maps) + raw_osm.json (OSM) → clean.json + clean.csv
   multi-area (5 พื้นที่ในโจทย์) — area มาจาก scrape, distance คิดต่อ center ของแต่ละพื้นที่
   รันจาก web/: python3 scripts/clean.py
"""
import json, re, csv, math
D = "data"
maps = json.load(open(f"{D}/raw_maps.json", encoding="utf-8"))
osm = json.load(open(f"{D}/raw_osm.json", encoding="utf-8"))

# ศูนย์กลางแต่ละพื้นที่ (BTS/MRT) — ใช้คิดระยะเดินทาง
AREA_CENTERS = {
    "สยาม": (13.7459, 100.5340),
    "อารีย์": (13.7798, 100.5440),
    "ทองหล่อ": (13.7376, 100.5800),
    "อโศก": (13.7383, 100.5614),
    "พร้อมพงษ์": (13.7305, 100.5697),
}
DEFAULT_CENTER = (13.7383, 100.5614)

def norm(s): return re.sub(r'[\s\-_.()&,]+', '', (s or '').lower())

osm_idx = {}
for o in osm:
    for nm in (o.get("name"), o.get("name_en")):
        if nm: osm_idx[norm(nm)] = o
def match_osm(name):
    n = norm(name)
    if n in osm_idx: return osm_idx[n]
    for k, o in osm_idx.items():
        if k and len(k) >= 5 and (k in n or n in k): return o
    return None

def parse_price(p):
    if not p: return (None, None)
    nums = [int(x.replace(',', '')) for x in re.findall(r'[\d,]+', p)]
    if not nums: return (None, None)
    if '+' in p: return (nums[0], None)
    if len(nums) >= 2: return (nums[0], nums[1])
    return (nums[0], nums[0])

def coords(u):
    m = re.search(r'!3d([\d.]+)!4d([\d.]+)', u or '')
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)

def haversine(a, b):
    if None in a or None in b: return None
    R = 6371000; p1, p2 = math.radians(a[0]), math.radians(b[0])
    dlat = math.radians(b[0] - a[0]); dlon = math.radians(b[1] - a[1])
    x = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return round(R * 2 * math.asin(math.sqrt(x)))

def parse_address(meta):
    for m in meta:
        if re.search(r'(เปิดอยู่|ปิดอยู่|ปิดเวลา|เปิดวัน|เปิด 24)', m): continue
        if re.search(r'(ซอย|ซ\.|ถ\.|ถนน|ชั้น|Sukhumvit|floor|Terminal|Rd|Soi|\d{1,4}/)', m):
            parts = [p.strip() for p in m.split('·') if p.strip()]
            for p in reversed(parts):
                if re.search(r'(ซอย|ซ\.|ถ\.|ถนน|ชั้น|Sukhumvit|floor|Terminal|Rd|Soi|\d)', p): return p
    return None

def parse_category(meta, fb):
    for m in meta:
        first = m.split('·')[0].strip()
        if first and not re.match(r'^\d', first) and '฿' not in first: return first
    return fb

def parse_hours(meta):
    for m in meta:
        h = re.search(r'(เปิด 24[^·]*|ปิดเวลา [\d:]+|เปิดวัน \S+ เวลา [\d:]+)', m)
        if h: return h.group(0).strip()
    return None

clean = []
for m in maps:
    if not (m.get("rating") and m.get("reviews")): continue  # price optional (Apify อาจเป็น tier)
    area = m.get("area", "อโศก")
    center = AREA_CENTERS.get(area, DEFAULT_CENTER)
    # lat/lon: Apify ให้ direct · Maps scrape parse จาก url
    lat = m["lat"] if m.get("lat") is not None else coords(m.get("url"))[0]
    lon = m["lon"] if m.get("lon") is not None else coords(m.get("url"))[1]
    o = match_osm(m["name"]); pmin, pmax = parse_price(m.get("price"))
    clean.append({
        "name": m["name"].strip(), "area": area,
        "category": m.get("category") or parse_category(m.get("meta", []), (o and o.get("cuisine")) or "ร้านอาหาร"),
        "cuisine_osm": (o and o.get("cuisine")) or None,
        "rating": m["rating"], "reviews": m["reviews"],
        "price_text": m.get("price"), "price_min": pmin, "price_max": pmax,
        # address/hours/website: Apify ให้ direct · ไม่งั้น parse จาก meta / enrich OSM
        "address": m.get("address") or parse_address(m.get("meta", [])),
        "lat": lat, "lon": lon, "distance_m": haversine(center, (lat, lon)),
        "hours": m.get("hours") or (o and o.get("hours")) or parse_hours(m.get("meta", [])),
        "website": m.get("website") or (o and o.get("website")) or None,
        "source_maps": m.get("url"), "matched_osm": bool(o),
    })

# dedupe (per ชื่อ — ข้ามพื้นที่ก็ถือว่าซ้ำถ้าชื่อเดียวกัน; keep most reviews)
clean.sort(key=lambda x: -x["reviews"])
kept = []
for c in clean:
    nk = norm(c["name"])
    if any((nk in norm(k["name"]) or norm(k["name"]) in nk) and min(len(nk), len(norm(k["name"]))) >= 6 for k in kept): continue
    kept.append(c)
clean = kept

json.dump(clean, open(f"{D}/clean.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
cols = ["name", "area", "category", "rating", "reviews", "price_text", "price_min", "price_max", "address", "distance_m", "hours", "website", "matched_osm", "source_maps"]
with open(f"{D}/clean.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore"); w.writeheader()
    for c in clean: w.writerow(c)

from collections import Counter
by_area = Counter(c["area"] for c in clean)
print(f"clean: {len(clean)} ร้าน (unique) · พื้นที่: {dict(by_area)}")
print(f"  matched OSM: {sum(1 for c in clean if c['matched_osm'])} | address: {sum(1 for c in clean if c['address'])} | distance: {sum(1 for c in clean if c['distance_m'] is not None)}")
