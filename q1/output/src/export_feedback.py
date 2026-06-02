import openpyxl, json
wb = openpyxl.load_workbook("q1/player_feedback_300_dataset.xlsx", data_only=True)
ws = wb["Feedback_Raw"]
rows = list(ws.iter_rows(values_only=True))
hdr = [str(h).strip() for h in rows[0]]
out = []
for r in rows[1:]:
    if r[0] is None: continue
    rec = {}
    for k,v in zip(hdr, r):
        if isinstance(v, str): v = v.strip()
        rec[k] = v if v is not None else ""
    # normalize date to ISO string
    if rec.get("date"): rec["date"] = str(rec["date"])
    out.append(rec)
with open("q1/output/data/feedback_raw.json","w",encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("exported", len(out), "records")
# quick data-quality checks
ids = [r["feedback_id"] for r in out]
print("unique ids:", len(set(ids)), "| dup:", len(ids)-len(set(ids)))
print("empty feedback:", sum(1 for r in out if not r["player_feedback"]))
print("empty area_hint:", sum(1 for r in out if not r["game_area_hint"]))
from collections import Counter
print("sources:", dict(Counter(r["source"] for r in out)))
print("segments:", dict(Counter(r["player_segment"] for r in out)))
print("platforms:", dict(Counter(r["platform"] for r in out)))
print("versions:", dict(Counter(r["game_version"] for r in out)))
