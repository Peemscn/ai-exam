# -*- coding: utf-8 -*-
"""restaurant-report.html — 10 sections + AI Q&A + search(90) + re-scrape สด (ผ่าน server.mjs)
   self-contained, responsive + dark
"""
import json
D="q3/output/data"
rows=json.load(open(f"{D}/scored.json",encoding="utf-8"))
AUTHOR="DEV : PEEM"; TODAY="2026-06-01"; AREA="อโศก (Asok / Sukhumvit)"
DATA90=[{"rank":r["rank"],"name":r["name"],"cat":r["category"],"rating":r["rating"],"reviews":r["reviews"],
         "price":r["price_text"],"dist":r["distance_m"],"total":r["total"],"url":r.get("source_maps",""),"scores":r["scores"]} for r in rows]
OVERALL=("ย่านอโศกมีร้านอาหารหนาแน่นมาก (เก็บได้ 90 ร้านในรัศมี ~800m จาก BTS) เรตติ้งสูงเกือบทั้งหมด (4.5★ ขึ้นไป) "
 "และหลากหลาย — ไทย / อินเดีย / ญี่ปุ่น / เม็กซิกัน / rooftop bar. สำหรับมื้อเย็นทีม 8–12 คน จุดตัดสินอยู่ที่ "
 "(1) ร้านรับกลุ่มใหญ่ได้จริง ดูจากจำนวนรีวิวที่มาก (2) เมนูแชร์กลางโต๊ะได้ (3) เดินจากสถานีไม่ไกล. "
 "Top 3 จึงเน้นร้านรีวิวหลักพัน–หมื่น เดินจากอโศกไม่เกิน ~10 นาที และเมนูเหมาะแชร์กลุ่ม")
TOP3=[
 {"why":["ใกล้สถานีที่สุดใน Top 10 (~80m เดิน 1–2 นาที) ทุกคนมาเจอง่าย","งบเป็นมิตร ฿200–400/คน เหมาะทีมหลายระดับ",
         "เมนูเม็กซิกัน (tacos/nachos/quesadilla) สั่งแชร์กลางโต๊ะได้ดี","รีวิวเกือบ 5,000 · 4.7★ = นิยมและรองรับลูกค้าจำนวนมาก"],
  "watch":"อยู่โซนการค้า โต๊ะกลุ่มใหญ่ควรจองล่วงหน้า และรสเม็กซิกันอาจไม่ถูกปากทุกคน"},
 {"why":["บาร์ + ดนตรีสด เหมาะสังสรรค์ทีมหลังเลิกงาน","เปิดถึงตี 2 นั่งยาวได้ไม่ต้องรีบ",
         "4.8★ รีวิวกว่า 6,700 การันตีความนิยม","งบ ฿400–1,600 ยืดหยุ่นตามการสั่ง"],
  "watch":"เน้นเครื่องดื่ม/บรรยากาศ เสียงดนตรีอาจดังเกินไปถ้าต้องคุยงานจริงจัง"},
 {"why":["รีวิวเยอะสุดใน Top 10 (กว่า 11,600) · 4.8★ = น่าเชื่อถือสูงสุด","อาหารอินเดีย (curry/naan/biryani) เป็นสำรับแชร์กลุ่มได้ดีมาก",
         "เปิดถึงตี 4 รองรับมื้อค่ำยาว ๆ","งบ ฿200–1,000 ครอบหลายระดับ"],
  "watch":"ไกลสุดใน Top 3 (~730m เดิน ~9 นาที) และอาหารอินเดีย/เผ็ดอาจไม่ถูกปากบางคน"}]
SCRITERIA=[("Rating & Review Quality","rating_review",25),("Group Suitability","group_suitability",20),
 ("Price Suitability","price_suitability",15),("Travel Convenience","travel_convenience",15),
 ("Data Completeness","data_completeness",15),("Uniqueness / Experience","uniqueness",10)]
SUBKEYS=[k for _,k,_ in SCRITERIA]
SUBLABEL={"rating_review":"R&R","group_suitability":"Group","price_suitability":"Price","travel_convenience":"Travel","data_completeness":"Data","uniqueness":"Uniq"}
def esc(s): return str(s if s is not None else "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

CSS="""
:root{--bg:#eef1f6;--surface:#fff;--surface2:#f7f9fc;--text:#1f2733;--muted:#6b7685;--border:#e1e7ef;--head:#15324e;--head2:#1f6f78;--accent:#1f6f78;--track:#e8edf4;--shadow:rgba(20,30,60,.08);--gold:#f5a623;--chip:#eef3f4}
[data-theme=dark]{--bg:#0c1420;--surface:#15202e;--surface2:#1b2838;--text:#e6ecf5;--muted:#93a3b8;--border:#26354a;--head:#0a1a2c;--head2:#2c9aa5;--accent:#2c9aa5;--track:#202d40;--shadow:rgba(0,0,0,.45);--gold:#ffbf47;--chip:#22303f}
*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}
body{font-family:"Sarabun","Noto Sans Thai","Segoe UI",Tahoma,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;transition:.2s}
.topbar{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--surface);border-bottom:1px solid var(--border);padding:10px 18px;box-shadow:0 2px 10px var(--shadow);overflow-x:auto}
.topbar .nav{display:flex;gap:4px}.topbar a{font-size:12px;color:var(--muted);text-decoration:none;padding:5px 9px;border-radius:7px;white-space:nowrap}.topbar a:hover{background:var(--track);color:var(--text)}
.ic{flex:0 0 auto;width:34px;height:34px;border:1px solid var(--border);background:var(--track);color:var(--text);border-radius:8px;cursor:pointer;font-size:15px}
.page{max-width:1080px;margin:0 auto;background:var(--surface);box-shadow:0 0 30px var(--shadow)}
header.hero{background:linear-gradient(135deg,var(--head),var(--head2));color:#fff;padding:34px 40px}
header.hero h1{font-size:27px;margin-bottom:8px}header.hero .meta{display:flex;gap:20px;flex-wrap:wrap;font-size:13px;opacity:.9;margin-top:12px}
section{padding:24px 40px;border-bottom:1px solid var(--border);scroll-margin-top:52px}
h2{font-size:19px;color:var(--head2);margin-bottom:12px;display:flex;gap:9px;align-items:center}
h2 .n{background:var(--head2);color:#fff;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 26px}
p.lead{font-size:14px}.muted{color:var(--muted);font-size:13px}code{background:var(--chip);padding:1px 6px;border-radius:5px;font-size:12px}
.wf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0}.wf .s{background:var(--chip);border:1px solid var(--border);border-radius:8px;padding:7px 13px;font-size:13px;font-weight:600;color:var(--head2)}.wf .a{color:var(--muted);font-weight:700}
.tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.tool{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px}.tool b{color:var(--head2);font-size:13.5px}.tool span{display:block;font-size:12px;color:var(--muted);margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px}
th{background:var(--head);color:#fff;padding:8px 9px;text-align:left;font-weight:600}
td{padding:8px 9px;border-bottom:1px solid var(--border);vertical-align:middle}tr:nth-child(even) td{background:var(--surface2)}
.rank{font-weight:800;color:var(--head2)}.star{color:var(--gold);font-weight:700;white-space:nowrap}
.bar{height:7px;background:var(--track);border-radius:4px;overflow:hidden;min-width:60px}.bar>i{display:block;height:100%;background:var(--head2);border-radius:4px}
.cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.rcard{border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--surface2);display:flex;flex-direction:column}
.rcard .top{background:linear-gradient(135deg,var(--head),var(--head2));color:#fff;padding:14px}.rcard .medal{font-size:22px}.rcard h3{font-size:16px;margin:4px 0}
.rcard .body{padding:14px;font-size:13px;flex:1}.rcard .facts{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.fact{background:var(--chip);border-radius:6px;padding:2px 8px;font-size:11.5px;color:var(--muted)}.rcard ul{margin:0 0 0 16px}.rcard li{margin:3px 0}
.watch{background:var(--surface);border-left:3px solid var(--gold);padding:7px 11px;border-radius:0 7px 7px 0;font-size:12.5px;margin-top:10px}
.crit{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed var(--border);font-size:13px}.crit .w{flex:0 0 46px;font-weight:800;color:var(--head2);text-align:right}.crit .lab{flex:0 0 210px;font-weight:600}
a.ev{color:var(--accent);font-size:12px;text-decoration:none}a.ev:hover{text-decoration:underline}
footer{padding:18px 40px;font-size:12px;color:var(--muted);background:var(--surface2)}
.ai-wrap{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:16px}
.ai-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.ai-wrap input,.ai-wrap textarea{padding:9px 11px;border:1px solid var(--border);border-radius:8px;font-size:13.5px;font-family:inherit;background:var(--surface);color:var(--text);width:100%}
.ai-wrap textarea{min-height:46px;resize:vertical}.ai-key{flex:1;min-width:200px}
.ai-btn{padding:9px 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer;font-size:14px;white-space:nowrap}.ai-btn:disabled{opacity:.5;cursor:not-allowed}
.chips{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.qchip{background:var(--chip);border:1px solid var(--border);border-radius:20px;padding:4px 11px;font-size:12px;cursor:pointer;color:var(--head2)}.qchip:hover{background:var(--track)}
.ai-ans{background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:13px;font-size:13.5px;margin-top:10px;white-space:pre-wrap;min-height:20px}
.ai-hint{font-size:11.5px;color:var(--muted);margin-top:6px}
.sc{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
.sc input,.sc select{padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;background:var(--surface);color:var(--text)}
#q{flex:1;min-width:170px}#scount{font-size:13px;color:var(--muted);font-weight:600;margin-left:auto}
th.sortable{cursor:pointer;user-select:none;white-space:nowrap}th.sortable:hover{background:var(--head2)}th .ar{opacity:.45;font-size:10px}th.on .ar{opacity:1}
.pager{display:flex;gap:9px;align-items:center;justify-content:center;padding:14px;flex-wrap:wrap}.pager .muted{font-size:13px}
.sbtn{padding:7px 12px;border:1px solid var(--border);background:var(--track);color:var(--text);border-radius:8px;cursor:pointer;font-size:13px}.sbtn:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:760px){header.hero{padding:24px 18px}section{padding:18px}.cards3{grid-template-columns:1fr}.crit .lab{flex-basis:130px}#scount{margin-left:0;width:100%}}
"""
def bar(v,mx): return f'<div class="bar"><i style="width:{v/mx*100:.0f}%"></i></div>'
medals=["🥇","🥈","🥉"]
H=[f'<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Food Assistant — {esc(AREA)}</title><style>{CSS}</style></head><body><div class="page">']
H.append('<div class="topbar"><div class="nav"><a href="#s1">เป้าหมาย</a><a href="#s2">Workflow</a><a href="#s3">Tools</a><a href="#s4">แหล่งข้อมูล</a><a href="#s5">เกณฑ์</a><a href="#s6">Top 3</a><a href="#sai">🤖 ถาม AI</a><a href="#s7">Top 10</a><a href="#ssearch">🔍 ค้นหา</a><a href="#s8">เปรียบเทียบ</a></div><button class="ic" id="theme" title="สลับธีม">🌙</button></div>')
H.append(f'<header class="hero"><h1>🍽️ AI Food Assistant — หาร้านมื้อทีมย่าน{esc(AREA)}</h1><div class="muted" style="color:#dfeaf0">ทีม 8–12 คน · ข้อมูลจริง + AI scoring · ค้นหา / ถาม AI / re-scrape สดได้</div><div class="meta"><span>📍 {esc(AREA)}</span><span>📅 {TODAY}</span><span>👤 {esc(AUTHOR)}</span><span>🤖 Claude</span></div></header>')
H.append(f'<section id="s1"><h2><span class="n">1</span>เป้าหมาย (Objective)</h2><p class="lead">ทีม 8–12 คนต้องเลือกร้านมื้อเย็นย่านอโศก โดยตัดสินจาก<b>ข้อมูลจริง</b>.<br><b>คำถาม:</b> จาก 90 ร้าน ร้านไหน <b>Top 3</b> เหมาะที่สุด เพราะอะไร (+ ค้นหา/ถาม AI/ดึงข้อมูลสดเองได้)</p></section>')
H.append('<section id="s2"><h2><span class="n">2</span>Workflow</h2><div class="wf"><span class="s">Scrape Google Maps</span><span class="a">→</span><span class="s">Fetch OSM</span><span class="a">→</span><span class="s">Clean</span><span class="a">→</span><span class="s">Scoring 100</span><span class="a">→</span><span class="s">AI Insight + Q&A</span><span class="a">→</span><span class="s">HTML + re-scrape API</span></div></section>')
H.append('<section id="s3"><h2><span class="n">3</span>Tools</h2><div class="tools"><div class="tool"><b>Playwright</b><span>scrape Maps + OSM (CLI + backend API)</span></div><div class="tool"><b>OSM Overpass</b><span>cuisine/พิกัด (แหล่งที่ 2)</span></div><div class="tool"><b>Claude</b><span>scoring + insight + Q&A สด</span></div><div class="tool"><b>Python</b><span>clean + score 100</span></div><div class="tool"><b>Node server.mjs</b><span>API /api/scrape (re-scrape สด)</span></div></div></section>')
H.append(f'<section id="s4"><h2><span class="n">4</span>แหล่งข้อมูล</h2><p class="lead">จริง <b>2 แหล่ง</b> รวม <b>{len(rows)} ร้าน</b>:</p><ul style="margin:8px 0 0 20px;font-size:13.5px"><li><b>Google Maps</b> · <a class="ev" href="https://www.google.com/maps/search/restaurants+near+Asok+Bangkok" target="_blank">↗</a></li><li><b>OSM Overpass</b> · <a class="ev" href="https://overpass-api.de/" target="_blank">↗</a></li></ul></section>')
crit="".join(f'<div class="crit"><span class="w">{w}</span><span class="lab">{esc(lab)}</span></div>' for lab,k,w in SCRITERIA)
H.append(f'<section id="s5"><h2><span class="n">5</span>เกณฑ์ให้คะแนน (100)</h2>{crit}<p class="muted" style="margin-top:8px">สูตรโปร่งใส (src/score.py)</p></section>')
c3=""
for i in range(3):
    r=rows[i]; ins=TOP3[i]
    facts=f'<span class="fact">{esc(r["category"])}</span><span class="fact">⭐ {r["rating"]} ({r["reviews"]:,})</span><span class="fact">{esc(r["price_text"])}</span><span class="fact">📍 {r["distance_m"]}m</span><span class="fact">คะแนน {r["total"]}</span>'
    why="".join(f"<li>{esc(w)}</li>" for w in ins["why"])
    c3+=f'<div class="rcard"><div class="top"><div class="medal">{medals[i]}</div><h3>{esc(r["name"])}</h3><div style="font-size:12px;opacity:.9">{esc(r.get("address") or AREA)}</div></div><div class="body"><div class="facts">{facts}</div><ul>{why}</ul><div class="watch">⚠ {esc(ins["watch"])}</div></div></div>'
H.append(f'<section id="s6"><h2><span class="n">6</span>🏆 แนะนำ Top 3</h2><div class="cards3">{c3}</div></section>')
H.append('<section id="sai"><h2><span class="n">7</span>🤖 ถาม AI (Interactive)</h2><p class="muted" style="margin-bottom:10px">ถาม AI ให้แนะนำร้านจาก data จริง 90 ร้าน</p><div class="ai-wrap"><div class="ai-row"><input class="ai-key" id="aikey" type="password" placeholder="วาง Anthropic API key (sk-ant-...) — เก็บใน browser นี้เท่านั้น"></div><div class="ai-row"><textarea id="aiq" placeholder="เช่น: ร้านไหนเหมาะกลุ่ม 10 คน งบ 500 คุยงานได้"></textarea></div><div class="chips" id="qchips"></div><button class="ai-btn" id="aibtn">ถาม AI 🚀</button><div class="ai-ans" id="aians">— คำตอบจะแสดงที่นี่ —</div><div class="ai-hint">Claude Haiku 4.5 · key อยู่ใน localStorage เครื่องนี้</div></div></section>')
trs=""
for r in rows[:10]:
    subs="".join(f'<td>{r["scores"][k]}</td>' for k in SUBKEYS)
    ev=f'<a class="ev" href="{esc(r["source_maps"])}" target="_blank">Maps ↗</a>' if r.get("source_maps") else ""
    trs+=f'<tr><td class="rank">#{r["rank"]}</td><td>{esc(r["name"])}<br><span class="muted">{esc(r["category"])} · {esc(r.get("address") or "")[:34]}</span></td><td class="star">⭐{r["rating"]}<br><span class="muted">{r["reviews"]:,}</span></td><td>{esc(r["price_text"])}</td><td>{r["distance_m"]}m</td>{subs}<td><b>{r["total"]}</b><br>{bar(r["total"],100)}</td><td>{ev}</td></tr>'
H.append(f'<section id="s7"><h2><span class="n">8</span>📊 Top 10 Ranking</h2>'
 '<div style="margin-bottom:10px"><button class="ai-btn" id="rescrape">🔄 re-scrape สด (Google Maps)</button> <span id="rsmsg" class="muted"></span></div>'
 '<div style="overflow-x:auto"><table><thead><tr><th>อันดับ</th><th>ร้าน</th><th>เรตติ้ง</th><th>ราคา</th><th>ระยะ</th>'+"".join(f'<th>{SUBLABEL[k]}</th>' for _,k,_ in SCRITERIA)+'<th>รวม/100</th><th>หลักฐาน</th></tr></thead><tbody id="top10body">'+trs+'</tbody></table></div>'
 '<p class="muted" style="margin-top:8px">R&R(25)·Group(20)·Price(15)·Travel(15)·Data(15)·Uniq(10) · ปุ่ม re-scrape ใช้ได้เมื่อเปิดผ่าน <code>node q3/output/src/server.mjs</code></p></section>')
H.append('<section id="ssearch"><h2><span class="n">9</span>🔍 ค้นหาร้าน (ทั้ง 90 ร้าน)</h2><p class="muted" style="margin-bottom:10px">หาร้านที่สนใจเอง — พิมพ์ชื่อ/ประเภท หรือกรอง แล้วคลิกหัวคอลัมน์เพื่อ sort</p>'
 '<div class="sc"><input id="q" placeholder="🔎 ค้นหาชื่อร้าน / ประเภท"><select id="fcat"><option value="">ทุกประเภท</option></select>'
 '<select id="fprice"><option value="">ทุกราคา</option><option value="lo">≤ ฿400</option><option value="mid">฿400–1,000</option><option value="hi">฿1,000+</option></select>'
 '<select id="fdist"><option value="">ทุกระยะ</option><option value="300">≤ 300m</option><option value="600">≤ 600m</option><option value="1000">≤ 1km</option></select>'
 '<button class="sbtn" id="sreset">ล้าง</button><span id="scount"></span></div>'
 '<div style="overflow-x:auto"><table><thead><tr id="shead"></tr></thead><tbody id="sbody"></tbody></table></div>'
 '<div class="pager"><button class="sbtn" id="sprev">‹ ก่อนหน้า</button><span class="muted" id="spage"></span><button class="sbtn" id="snext">ถัดไป ›</button></div></section>')
H.append(f'<section id="s8"><h2><span class="n">10</span>เปรียบเทียบ &amp; Insight</h2><p class="lead">{esc(OVERALL)}</p><table style="margin-top:12px"><tr><th>ร้าน</th><th>จุดเด่น</th><th>ข้อควรระวัง</th></tr>'
 +"".join(f'<tr><td><b>{medals[i]} {esc(rows[i]["name"])}</b></td><td>{esc(TOP3[i]["why"][0])}</td><td>{esc(TOP3[i]["watch"])}</td></tr>' for i in range(3))+'</table></section>')
H.append(f'<footer>AI Food Assistant · ย่าน{esc(AREA)} · {len(rows)} ร้าน (Google Maps + OSM) · Claude · {TODAY} · {esc(AUTHOR)}</footer>')

DATA_JSON=json.dumps(DATA90,ensure_ascii=False)
JS=r"""const root=document.documentElement,tb=document.getElementById('theme');
function setT(t){root.dataset.theme=t;tb.textContent=t==='dark'?'☀️':'🌙';try{localStorage.setItem('q3theme',t)}catch(e){}}
tb.onclick=()=>setT(root.dataset.theme==='dark'?'light':'dark');
(function(){let t;try{t=localStorage.getItem('q3theme')}catch(e){}if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';setT(t);})();
let DATA=__DATA__;
function esc(s){return (s==null?'':''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
const key=document.getElementById('aikey'),q2=document.getElementById('aiq'),ans=document.getElementById('aians'),btn=document.getElementById('aibtn');
try{const k=localStorage.getItem('anthropic_key');if(k)key.value=k;}catch(e){}
['ร้านไหนเหมาะกลุ่ม 10 คน งบ 500 คุยงานได้','อยากได้ร้านอาหารไทยใกล้ BTS เรตติ้งดี','ร้านบรรยากาศดีเปิดดึก สังสรรค์ทีม','งบ 300 ต่อคน มีร้านไหนแนะนำ'].forEach(s=>{const c=document.createElement('span');c.className='qchip';c.textContent=s;c.onclick=()=>{q2.value=s;};document.getElementById('qchips').appendChild(c);});
async function ask(){const k=key.value.trim(),question=q2.value.trim();
 if(!k){ans.textContent='⚠ ใส่ Anthropic API key ก่อน';return;}if(!question){ans.textContent='⚠ พิมพ์คำถามก่อน';return;}
 try{localStorage.setItem('anthropic_key',k);}catch(e){}btn.disabled=true;ans.textContent='⏳ กำลังถาม Claude...';
 const sys='คุณเป็นผู้ช่วยแนะนำร้านอาหารมื้อทีม 8-12 คน ย่านอโศก. ตอบสั้นกระชับภาษาไทย แนะนำจากข้อมูลที่ให้เท่านั้น พร้อมเหตุผล+ตัวเลข. ข้อมูล: '+JSON.stringify(DATA);
 try{const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1024,system:sys,messages:[{role:'user',content:question}]})});
  const j=await res.json();ans.textContent=(j.content&&j.content[0])?j.content[0].text:'⚠ '+(j.error?j.error.message:'ไม่มีคำตอบ');
 }catch(e){ans.textContent='⚠ error: '+e.message;}btn.disabled=false;}
btn.onclick=ask;
const COLS=[['rank','#'],['name','ร้าน'],['cat','ประเภท'],['rating','เรตติ้ง'],['reviews','รีวิว'],['price','ราคา'],['dist','ระยะ(m)'],['total','คะแนน'],['url','']];
let sortK='rank',sortD=1,page=1,PS=15;
const $=id=>document.getElementById(id);
[...new Set(DATA.map(x=>x.cat))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('fcat').appendChild(o);});
COLS.forEach(([k,l])=>{const th=document.createElement('th');if(k!=='url'){th.className='sortable';th.dataset.k=k;th.innerHTML=l+' <span class="ar">↕</span>';th.onclick=()=>{if(sortK===k)sortD*=-1;else{sortK=k;sortD=1;}page=1;render();};}else th.textContent=l;$('shead').appendChild(th);});
function filtered(){const s=$('q').value.toLowerCase(),fc=$('fcat').value,fp=$('fprice').value,fd=$('fdist').value;
 return DATA.filter(x=>{if(s&&!(x.name+' '+x.cat).toLowerCase().includes(s))return false;if(fc&&x.cat!==fc)return false;
  if(fd&&!(x.dist!=null&&x.dist<=+fd))return false;
  if(fp){const mn=parseInt((x.price||'').replace(/[^\d]/g,''))||0;if(fp==='lo'&&mn>400)return false;if(fp==='mid'&&(mn<400||mn>1000))return false;if(fp==='hi'&&mn<1000)return false;}
  return true;});}
function render(){let r=filtered();
 r.sort((a,b)=>{let x=a[sortK],y=b[sortK];if(typeof x==='string'){x=x||'';y=y||'';}else{x=x==null?-1:x;y=y==null?-1:y;}return (x>y?1:x<y?-1:0)*sortD;});
 const pages=Math.max(1,Math.ceil(r.length/PS));if(page>pages)page=pages;
 const sl=r.slice((page-1)*PS,page*PS);
 $('sbody').innerHTML=sl.map(x=>`<tr><td class="rank">#${x.rank}</td><td>${esc(x.name)}</td><td><span class="muted">${esc(x.cat)}</span></td><td class="star">⭐${x.rating}</td><td>${(x.reviews||0).toLocaleString()}</td><td>${esc(x.price)}</td><td>${x.dist==null?'-':x.dist}</td><td><b>${x.total}</b></td><td>${x.url?`<a class="ev" href="${esc(x.url)}" target="_blank">Maps ↗</a>`:''}</td></tr>`).join('');
 document.querySelectorAll('th.sortable').forEach(t=>{t.classList.toggle('on',t.dataset.k===sortK);const a=t.querySelector('.ar');if(a)a.textContent=t.dataset.k===sortK?(sortD>0?'▲':'▼'):'↕';});
 $('scount').textContent='แสดง '+sl.length+' จาก '+r.length+' (ทั้งหมด '+DATA.length+')';
 $('spage').textContent='หน้า '+page+' / '+pages;$('sprev').disabled=page<=1;$('snext').disabled=page>=pages;}
['q','fcat','fprice','fdist'].forEach(id=>$(id).addEventListener('input',()=>{page=1;render();}));
$('sreset').onclick=()=>{$('q').value='';$('fcat').value='';$('fprice').value='';$('fdist').value='';page=1;render();};
$('sprev').onclick=()=>{if(page>1){page--;render();}};$('snext').onclick=()=>{page++;render();};
/* ---- re-scrape สด (ผ่าน server.mjs) ---- */
function renderTop10(arr){const SK=['rating_review','group_suitability','price_suitability','travel_convenience','data_completeness','uniqueness'];
 $('top10body').innerHTML=arr.slice(0,10).map(r=>{const subs=SK.map(k=>`<td>${r.scores?r.scores[k]:'-'}</td>`).join('');
  return `<tr><td class="rank">#${r.rank}</td><td>${esc(r.name)}<br><span class="muted">${esc(r.cat)}</span></td><td class="star">⭐${r.rating}<br><span class="muted">${(r.reviews||0).toLocaleString()}</span></td><td>${esc(r.price)}</td><td>${r.dist}m</td>${subs}<td><b>${r.total}</b></td><td>${r.url?`<a class="ev" href="${esc(r.url)}" target="_blank">Maps ↗</a>`:''}</td></tr>`;}).join('');}
const rsb=$('rescrape'),rsm=$('rsmsg');
rsb.onclick=async()=>{rsb.disabled=true;rsm.textContent='⏳ กำลัง scrape Google Maps สด (~30 วิ)...';
 try{const r=await fetch('/api/scrape');const j=await r.json();
  if(j.ok){DATA=j.data;[...new Set(DATA.map(x=>x.cat))];renderTop10(j.data);page=1;render();rsm.textContent='✓ อัปเดต '+j.count+' ร้านสด ('+new Date().toLocaleTimeString('th-TH')+')';}
  else rsm.textContent='⚠ '+j.error;
 }catch(e){rsm.textContent='⚠ ต้องเปิดผ่าน server: node q3/output/src/server.mjs (file:// เรียก /api/scrape ไม่ได้)';}
 rsb.disabled=false;};
render();"""
JS=JS.replace("__DATA__",DATA_JSON)
H.append("</div><script>"+JS+"</script></body></html>")
open("q3/output/deliverables/restaurant-report.html","w",encoding="utf-8").write("".join(H))
print("saved restaurant-report.html |", len("".join(H)), "chars | +re-scrape +search +AI Q&A | 90 ร้าน")
