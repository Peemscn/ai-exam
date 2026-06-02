# -*- coding: utf-8 -*-
"""classified_data.html — ตาราง 300 แถว interactive + responsive + advanced
   features: search · filter (sentiment/category/priority/segment) · sortable
             · pagination · CSV export (filtered) · dark mode · table↔card responsive
   self-contained ไม่พึ่ง CDN. เปิด browser ได้เลย (แทน Excel/Google Sheet)
"""
import json
raw={r["feedback_id"]:r for r in json.load(open("q1/output/data/feedback_raw.json",encoding="utf-8"))}
rows=[]
for line in open("q1/output/data/classified.jsonl",encoding="utf-8"):
    c=json.loads(line); r=raw[c["feedback_id"]]
    rows.append({"id":c["feedback_id"],"seg":r["player_segment"],"src":r["source"],
        "plat":r["platform"],"ver":r["game_version"],"fb":r["player_feedback"],
        "sent":c["sentiment"],"cat":c["category"],"prio":c["priority"],
        "sum":c["ai_summary"],"owner":c["suggested_owner"],"conf":c["confidence"],"note":c["review_note"]})
DATA=json.dumps(rows,ensure_ascii=False)

TEMPLATE=r"""<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Classified Feedback — 300 รายการ</title><style>
:root{
 --bg:#eef1f5;--surface:#fff;--text:#23272e;--muted:#667;--border:#e3e8ef;
 --head:#1F3864;--head2:#2c5aa0;--row:#f9fafc;--rowh:#f0f4fa;--ctrl:#f4f7fa;--chip:#eef1f5;--shadow:rgba(0,0,0,.08);
 --neg:#ffd7d7;--neu:#fff3cd;--pos:#d7f5dd;--hi:#ffb3b3;--md:#ffe08a;--lo:#cdeecd;--low:#c00000;}
[data-theme=dark]{
 --bg:#0f141b;--surface:#1a212b;--text:#e6eaf0;--muted:#9aa7b6;--border:#2a3340;
 --head:#0d1b34;--head2:#16223c;--row:#1e2632;--rowh:#26303d;--ctrl:#222b37;--chip:#2a3340;--shadow:rgba(0,0,0,.4);
 --neg:#5a2a2a;--neu:#5a4d22;--pos:#26452f;--hi:#6e2f2f;--md:#6b5524;--lo:#2f5236;--low:#ff9a9a;}
*{box-sizing:border-box}
body{font-family:"Sarabun","Noto Sans Thai","Leelawadee UI","Tahoma",sans-serif;margin:0;background:var(--bg);color:var(--text);transition:background .2s,color .2s}
.head{background:linear-gradient(135deg,var(--head),var(--head2));color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.head h1{margin:0;font-size:19px}.head p{margin:3px 0 0;opacity:.85;font-size:12.5px}
.btn{padding:7px 12px;border:1px solid var(--border);background:var(--ctrl);color:var(--text);border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;white-space:nowrap}
.btn:hover{filter:brightness(.97)}.btn:active{transform:translateY(1px)}
.head .btn{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.25);color:#fff}
.controls{position:sticky;top:0;background:var(--surface);padding:11px 22px;border-bottom:1px solid var(--border);display:flex;gap:9px;flex-wrap:wrap;align-items:center;z-index:10;box-shadow:0 2px 8px var(--shadow)}
.controls input,.controls select{padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;background:var(--surface);color:var(--text)}
#q{flex:1;min-width:170px}
#cnt{font-size:13px;color:var(--muted);font-weight:600;margin-left:auto;white-space:nowrap}
.wrap{padding:0 22px 26px}
table{width:100%;border-collapse:collapse;font-size:12.5px;background:var(--surface);margin-top:14px}
th{background:var(--head);color:#fff;padding:8px 9px;text-align:left;position:sticky;top:var(--ch,57px);z-index:3;cursor:pointer;white-space:nowrap;user-select:none}
th:hover{background:var(--head2)}th .ar{opacity:.45;font-size:10px;margin-left:2px}th.s .ar{opacity:1}
td{padding:7px 9px;border-bottom:1px solid var(--border);vertical-align:top}
tr:nth-child(even) td{background:var(--row)}tr:hover td{background:var(--rowh)}
.fb{max-width:330px}.sm{max-width:240px;color:var(--muted)}.nt{max-width:220px;color:var(--muted);font-size:11.5px}
.pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:600;white-space:nowrap;color:#3a2a2a}
[data-theme=dark] .pill{color:#e6eaf0}
.lowconf{color:var(--low);font-weight:700}
.tag{font-size:11px;background:var(--chip);padding:1px 6px;border-radius:5px;white-space:nowrap}
.pager{display:flex;gap:9px;align-items:center;justify-content:center;padding:16px;flex-wrap:wrap}
.pager span{font-size:13px;color:var(--muted)}
.chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 22px;margin-top:10px}
.chip{font-size:11.5px;background:var(--chip);border:1px solid var(--border);padding:2px 9px;border-radius:20px;display:none;align-items:center;gap:5px}
.chip b{font-weight:600}.chip i{cursor:pointer;font-style:normal;opacity:.6}.chip i:hover{opacity:1}
@media(max-width:720px){
 .wrap{padding:0 12px 24px;overflow:visible}
 table{min-width:0}thead{display:none}
 table,tbody,tr,td{display:block;width:100%}
 tr{background:var(--surface)!important;border:1px solid var(--border);border-radius:10px;margin:10px 0;padding:6px 4px;box-shadow:0 1px 4px var(--shadow)}
 tr td{background:transparent!important}
 td{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border);padding:7px 12px;max-width:none}
 td:last-child{border-bottom:0}
 td::before{content:attr(data-label);font-weight:700;color:var(--muted);flex:0 0 42%;font-size:11.5px}
 td.fb,td.sm,td.nt{max-width:none;text-align:right}
 .controls{top:0}#cnt{margin-left:0;width:100%}
}
</style></head><body>
<div class="head">
 <div><h1>📋 Classified Feedback — 300 รายการ</h1><p>search · filter · sort · pagination · CSV export — เปิดเบราว์เซอร์ได้เลย ไม่ต้อง Excel/Google Sheet</p></div>
 <div style="display:flex;gap:8px"><button class="btn" id="csv">⬇ CSV (ที่กรอง)</button><button class="btn" id="theme">🌙</button></div>
</div>
<div class="controls">
 <input id="q" placeholder="🔎 ค้นหา (id, ข้อความ, owner ...)">
 <select id="f-sent"><option value="">Sentiment: ทั้งหมด</option></select>
 <select id="f-cat"><option value="">Category: ทั้งหมด</option></select>
 <select id="f-prio"><option value="">Priority: ทั้งหมด</option></select>
 <select id="f-seg"><option value="">Segment: ทั้งหมด</option></select>
 <select id="psize"><option value="25">25/หน้า</option><option value="50" selected>50/หน้า</option><option value="100">100/หน้า</option><option value="999">ทั้งหมด</option></select>
 <button class="btn" id="reset">ล้าง</button>
 <span id="cnt"></span>
</div>
<div class="chips" id="chips"></div>
<div class="wrap"><table><thead><tr id="hr"></tr></thead><tbody id="tb"></tbody></table></div>
<div class="pager"><button class="btn" id="prev">‹ ก่อนหน้า</button><span id="pinfo"></span><button class="btn" id="next">ถัดไป ›</button></div>
<script>
const DATA=/*DATA*/;
const COLS=[["id","ID"],["seg","Segment"],["src","Source"],["ver","Ver"],["fb","Feedback (ดิบ)"],["sent","Sentiment"],["cat","Category"],["prio","Priority"],["sum","AI Summary"],["owner","Owner"],["conf","Conf"],["note","Review Note"]];
const SENT={"Negative":"var(--neg)","Neutral":"var(--neu)","Positive":"var(--pos)"};
const PRIO={"High":"var(--hi)","Medium":"var(--md)","Low":"var(--lo)"};
const $=id=>document.getElementById(id);
let sortCol="id",sortDir=1,page=1;
function uniq(k){return [...new Set(DATA.map(r=>r[k]))].sort();}
function fillSel(id,k){const s=$(id);uniq(k).forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;s.appendChild(o);});}
fillSel("f-sent","sent");fillSel("f-cat","cat");fillSel("f-prio","prio");fillSel("f-seg","seg");
const hr=$("hr");
COLS.forEach(([k,lab])=>{const th=document.createElement("th");th.dataset.k=k;th.innerHTML=lab+' <span class="ar">↕</span>';
 th.onclick=()=>{if(sortCol===k)sortDir*=-1;else{sortCol=k;sortDir=1;}page=1;render();};hr.appendChild(th);});
function esc(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function filtered(){
 const q=$("q").value.toLowerCase();
 const fs=$("f-sent").value,fc=$("f-cat").value,fp=$("f-prio").value,fg=$("f-seg").value;
 return DATA.filter(x=>(!fs||x.sent===fs)&&(!fc||x.cat===fc)&&(!fp||x.prio===fp)&&(!fg||x.seg===fg)
   &&(!q||(x.id+x.fb+x.sum+x.owner+x.note+x.seg+x.src).toLowerCase().includes(q)));
}
function render(){
 let r=filtered();
 const O={Low:0,Medium:1,High:2};
 r.sort((a,b)=>{let x=a[sortCol],y=b[sortCol];if(sortCol==="prio"){x=O[x];y=O[y];}return (x>y?1:x<y?-1:0)*sortDir;});
 const ps=+$("psize").value,pages=Math.max(1,Math.ceil(r.length/ps));
 if(page>pages)page=pages;
 const slice=r.slice((page-1)*ps,page*ps);
 $("tb").innerHTML=slice.map(x=>`<tr>
   <td data-label="ID"><b>${x.id}</b></td><td data-label="Segment">${esc(x.seg)}</td><td data-label="Source">${esc(x.src)}</td><td data-label="Ver">${x.ver}</td>
   <td class="fb" data-label="Feedback">${esc(x.fb)}</td>
   <td data-label="Sentiment"><span class="pill" style="background:${SENT[x.sent]}">${x.sent}</span></td>
   <td data-label="Category"><span class="tag">${esc(x.cat)}</span></td>
   <td data-label="Priority"><span class="pill" style="background:${PRIO[x.prio]}">${x.prio}</span></td>
   <td class="sm" data-label="AI Summary">${esc(x.sum)}</td><td data-label="Owner">${esc(x.owner)}</td>
   <td data-label="Conf" class="${x.conf==='Low'?'lowconf':''}">${x.conf}</td><td class="nt" data-label="Review Note">${esc(x.note)}</td></tr>`).join("");
 document.querySelectorAll("th").forEach(t=>{t.classList.toggle("s",t.dataset.k===sortCol);
   const ar=t.querySelector(".ar");if(ar)ar.textContent=t.dataset.k===sortCol?(sortDir>0?"▲":"▼"):"↕";});
 $("cnt").textContent=`แสดง ${slice.length} จาก ${r.length} (ทั้งหมด ${DATA.length})`;
 $("pinfo").textContent=`หน้า ${page} / ${pages}`;
 $("prev").disabled=page<=1;$("next").disabled=page>=pages;
 renderChips();
}
function renderChips(){
 const box=$("chips");box.innerHTML="";
 [["f-sent","Sentiment"],["f-cat","Category"],["f-prio","Priority"],["f-seg","Segment"]].forEach(([id,lab])=>{
   const v=$(id).value;if(!v)return;
   const c=document.createElement("span");c.className="chip";c.style.display="inline-flex";
   c.innerHTML=`<b>${lab}:</b> ${esc(v)} <i title="ลบ">✕</i>`;
   c.querySelector("i").onclick=()=>{$(id).value="";page=1;render();};box.appendChild(c);});
}
function toCSV(){
 const r=filtered();const cols=COLS.map(c=>c[0]);
 const head=COLS.map(c=>c[1]).join(",");
 const esc=s=>{s=(s==null?"":""+s);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
 const body=r.map(x=>cols.map(k=>esc(x[k])).join(",")).join("\n");
 const blob=new Blob(["﻿"+head+"\n"+body],{type:"text/csv;charset=utf-8"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);
 a.download="feedback_filtered_"+r.length+".csv";a.click();URL.revokeObjectURL(a.href);
}
["q","f-sent","f-cat","f-prio","f-seg","psize"].forEach(id=>$(id).addEventListener("input",()=>{page=1;render();}));
$("reset").onclick=()=>{$("q").value="";["f-sent","f-cat","f-prio","f-seg"].forEach(id=>$(id).value="");page=1;render();};
$("prev").onclick=()=>{if(page>1){page--;render();window.scrollTo({top:0,behavior:"smooth"});}};
$("next").onclick=()=>{page++;render();window.scrollTo({top:0,behavior:"smooth"});};
$("csv").onclick=toCSV;
function setTheme(t){document.documentElement.dataset.theme=t;$("theme").textContent=t==="dark"?"☀️":"🌙";try{localStorage.setItem("fbtheme",t)}catch(e){}}
$("theme").onclick=()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
(function(){let t;try{t=localStorage.getItem("fbtheme")}catch(e){}
 if(!t)t=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";setTheme(t);})();
function setStick(){const c=document.querySelector(".controls");if(c)document.documentElement.style.setProperty("--ch",c.offsetHeight+"px");}
addEventListener("resize",setStick);addEventListener("load",setStick);setStick();
render();
</script></body></html>"""
open("q1/output/deliverables/classified_data.html","w",encoding="utf-8").write(TEMPLATE.replace("/*DATA*/",DATA))
print("saved classified_data.html |", len(rows), "rows | responsive + dark + CSV + pagination")
