# -*- coding: utf-8 -*-
"""คำนวณ insight + cross-tabs จาก classified data -> insights.json (+ พิมพ์สรุป)
   ไม่ใช่แค่นับ: หา risk (revenue/retention), opportunity, top issues, segment pattern
"""
import json
from collections import Counter, defaultdict

raw={r["feedback_id"]:r for r in json.load(open("q1/output/data/feedback_raw.json",encoding="utf-8"))}
rows=[]
for line in open("q1/output/data/classified.jsonl",encoding="utf-8"):
    c=json.loads(line); c.update({k:raw[c["feedback_id"]][k] for k in
        ("player_segment","source","platform","game_version","date")}); rows.append(c)
N=len(rows)
def pct(n): return round(n/N*100,1)
def dist(field): return {k:v for k,v in Counter(r[field] for r in rows).most_common()}

I={}
I["total"]=N
I["date_range"]=[min(r["date"] for r in rows)[:10], max(r["date"] for r in rows)[:10]]
I["versions"]=dist("game_version"); I["sources"]=dist("source"); I["platforms"]=dist("platform")
I["segments"]=dist("player_segment")
I["sentiment"]={k:{"n":v,"pct":pct(v)} for k,v in dist("sentiment").items()}
I["category"]={k:{"n":v,"pct":pct(v)} for k,v in dist("category").items()}
I["priority"]={k:{"n":v,"pct":pct(v)} for k,v in dist("priority").items()}
I["owner"]=dist("suggested_owner")
I["confidence"]=dist("confidence")

# ---- Top issues (by canonical theme) ----
theme_ct=Counter(r["matched_theme"] for r in rows)
theme_meta={}
for r in rows:
    theme_meta.setdefault(r["matched_theme"],(r["category"],r["ai_summary"],r["sentiment"]))
I["top_issues"]=[{"theme":t,"count":c,"category":theme_meta[t][0],"summary":theme_meta[t][1],
                  "sentiment":theme_meta[t][2]} for t,c in theme_ct.most_common(12)]
# Top issues เฉพาะที่ negative (ปัญหาจริง)
neg_theme=Counter(r["matched_theme"] for r in rows if r["sentiment"]=="Negative")
I["top_negative_issues"]=[{"theme":t,"count":c,"category":theme_meta[t][0],"summary":theme_meta[t][1]}
                          for t,c in neg_theme.most_common(8)]
# High-priority breakdown
hi=[r for r in rows if r["priority"]=="High"]
I["high_priority_total"]=len(hi)
I["high_priority_by_theme"]=[{"theme":t,"count":c,"category":theme_meta[t][0]}
                             for t,c in Counter(r["matched_theme"] for r in hi).most_common(8)]
I["high_priority_by_category"]={k:v for k,v in Counter(r["category"] for r in hi).most_common()}

# ---- segment × sentiment (negative rate = สัญญาณความไม่พอใจต่อกลุ่ม) ----
seg_sent=defaultdict(Counter)
for r in rows: seg_sent[r["player_segment"]][r["sentiment"]]+=1
I["segment_sentiment"]={}
for seg,ct in seg_sent.items():
    tot=sum(ct.values())
    I["segment_sentiment"][seg]={"total":tot,"Negative":ct["Negative"],"Neutral":ct["Neutral"],
        "Positive":ct["Positive"],"neg_pct":round(ct["Negative"]/tot*100,1)}

# ---- segment × category (กลุ่มไหนบ่นเรื่องอะไร) ----
seg_cat=defaultdict(Counter)
for r in rows: seg_cat[r["player_segment"]][r["category"]]+=1
I["segment_top_category"]={seg:ct.most_common(3) for seg,ct in seg_cat.items()}

# ---- category × sentiment ----
cat_sent=defaultdict(Counter)
for r in rows: cat_sent[r["category"]][r["sentiment"]]+=1
I["category_sentiment"]={c:dict(ct) for c,ct in cat_sent.items()}

# ---- platform × Bug (หา technical hotspot) ----
plat_bug=Counter(r["platform"] for r in rows if r["category"]=="Bug / Technical Issue")
I["platform_bug"]=dict(plat_bug)
I["platform_total"]=dist("platform")

# ---- version × sentiment trend (v1.8.0 -> v1.9.1) ----
ver_sent=defaultdict(Counter)
for r in rows: ver_sent[r["game_version"]][r["sentiment"]]+=1
I["version_trend"]={}
for v in sorted(ver_sent):
    ct=ver_sent[v]; tot=sum(ct.values())
    I["version_trend"][v]={"total":tot,"neg_pct":round(ct["Negative"]/tot*100,1),"pos_pct":round(ct["Positive"]/tot*100,1)}

# ---- source × negative (ช่องทางไหนเสียงดังเชิงลบ) ----
src_sent=defaultdict(Counter)
for r in rows: src_sent[r["source"]][r["sentiment"]]+=1
I["source_sentiment"]={s:{"total":sum(ct.values()),"neg_pct":round(ct["Negative"]/sum(ct.values())*100,1)}
                       for s,ct in src_sent.items()}

# ---- RISK: revenue (กลุ่มจ่ายเงิน บ่นเรื่อง monetization/economy) ----
REV_CAT={"Gacha / Monetization","Reward / Economy"}
PAYING={"Whale","Guild Leader","Mid Spender","Light Spender"}
rev_complaints=[r for r in rows if r["category"] in REV_CAT and r["sentiment"]=="Negative"]
rev_paying=[r for r in rev_complaints if r["player_segment"] in PAYING]
I["risk_revenue"]={"total_negative_monetization":len(rev_complaints),
    "from_paying_segments":len(rev_paying),
    "whale_monetization_neg":sum(1 for r in rev_complaints if r["player_segment"]=="Whale")}
# RISK: retention (มือใหม่/กลับมา เจอ balance/onboarding/economy)
RET_SEG={"New Player","Returning Player"}
ret_neg=[r for r in rows if r["player_segment"] in RET_SEG and r["sentiment"]=="Negative"]
I["risk_retention"]={"new_returning_negative":len(ret_neg),
    "new_returning_total":sum(1 for r in rows if r["player_segment"] in RET_SEG)}
# OPPORTUNITY: positive themes
I["opportunity_positive"]=[{"theme":t,"count":c} for t,c in
    Counter(r["matched_theme"] for r in rows if r["sentiment"]=="Positive").most_common(6)]

json.dump(I,open("q1/output/data/insights.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)

# ---- print human-readable summary ----
print("="*60)
print(f"TOTAL {N} | {I['date_range'][0]} ถึง {I['date_range'][1]} | versions {list(I['versions'])}")
print("Sentiment:", {k:f"{v['n']} ({v['pct']}%)" for k,v in I['sentiment'].items()})
print(f"High priority: {I['high_priority_total']} ({pct(I['high_priority_total'])}%)")
print("\n--- TOP 8 NEGATIVE ISSUES ---")
for x in I["top_negative_issues"]:
    print(f"  {x['count']:3}  [{x['category']:22}] {x['summary']}")
print("\n--- SEGMENT x NEGATIVE RATE ---")
for seg,d in sorted(I["segment_sentiment"].items(),key=lambda x:-x[1]["neg_pct"]):
    print(f"  {seg:16} neg {d['neg_pct']:5}%  (n={d['total']})")
print("\n--- VERSION TREND (neg%) ---")
for v,d in I["version_trend"].items(): print(f"  {v}: neg {d['neg_pct']}%  pos {d['pos_pct']}%  (n={d['total']})")
print("\n--- PLATFORM x BUG ---")
for p in I["platform_total"]:
    b=I["platform_bug"].get(p,0); print(f"  {p:14} bug {b}/{I['platform_total'][p]} ({round(b/I['platform_total'][p]*100,1)}%)")
print("\n--- RISK ---")
print(f"  Revenue : {I['risk_revenue']['total_negative_monetization']} neg monetization/economy, "
      f"{I['risk_revenue']['from_paying_segments']} จากกลุ่มจ่ายเงิน (Whale {I['risk_revenue']['whale_monetization_neg']})")
print(f"  Retention: New/Returning negative {I['risk_retention']['new_returning_negative']}/{I['risk_retention']['new_returning_total']}")
print("\n--- SOURCE neg% (เสียงเชิงลบดังสุด) ---")
for s,d in sorted(I["source_sentiment"].items(),key=lambda x:-x[1]["neg_pct"])[:4]:
    print(f"  {s:20} neg {d['neg_pct']}% (n={d['total']})")
print("\nsaved insights.json")
