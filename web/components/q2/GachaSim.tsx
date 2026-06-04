"use client";

import { useEffect, useState } from "react";
import {
  RAR, type Rarity, type Item, type Rates, type PityCtx,
  rateTotal, pickRarity, computeRolls, missingPools,
} from "@/lib/gacha";
import { downloadCSV } from "@/lib/csv";

const RCOL: Record<Rarity, string> = { SSR: "#ffbf47", SR: "#bd93f8", R: "#6ba6ff", N: "#8390a3" };
const SAMPLE: Item[] = [
  { name: "Aurora", rarity: "SSR" }, { name: "Seraphine", rarity: "SSR" },
  { name: "Kai", rarity: "SR" }, { name: "Luna", rarity: "SR" }, { name: "Rex", rarity: "SR" },
  { name: "Mika", rarity: "R" }, { name: "Astra", rarity: "R" }, { name: "Bolt", rarity: "R" }, { name: "Vera", rarity: "R" },
  { name: "Recruit", rarity: "N" }, { name: "Scout", rarity: "N" }, { name: "Grunt", rarity: "N" }, { name: "Cadet", rarity: "N" }, { name: "Rookie", rarity: "N" },
];
const mini = { width: 68, background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text)", padding: "7px 9px", borderRadius: 8, fontFamily: "inherit" } as const;
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });


type SimResult = { n: number; cnt: Record<Rarity, number>; cost: number };
type MCResult = { paid: number; free: number; total: number; chance1: number; avg: number; best: number; worst: number; dist: Record<string, number>; sims: number; budget: number; price: number };

export default function GachaSim() {
  const [rates, setRates] = useState<Rates>({ SSR: 1, SR: 9, R: 30, N: 60 });
  const [pool, setPool] = useState<Item[]>(SAMPLE);
  const [itName, setItName] = useState(""); const [itRar, setItRar] = useState<Rarity>("SSR");
  const [pityOn, setPityOn] = useState(true); const [pityTh, setPityTh] = useState(90); const [pityC, setPityC] = useState(0);
  const [sRolls, setSRolls] = useState(100); const [sPrice, setSPrice] = useState(10);
  const [sim, setSim] = useState<SimResult | null>(null); const [lastPull, setLastPull] = useState<{ roll: number; rarity: string; item: string; cost: number }[]>([]);
  const [hist, setHist] = useState<{ t: string; n: number; SSR: number; SR: number; R: number; N: number; cost: number }[]>([]);
  const [budget, setBudget] = useState(3000); const [price, setPrice] = useState(30); const [sims, setSims] = useState(2000);
  const [freeOn, setFreeOn] = useState(true); const [freeX, setFreeX] = useState(10); const [freeY, setFreeY] = useState(1);
  const [mc, setMc] = useState<MCResult | null>(null);
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [err, setErr] = useState("");

  const total = rateTotal(rates); const rateOk = Math.abs(total - 100) < 0.001;
  const missing = missingPools(rates, pool);

  useEffect(() => { loadSessions(); }, []);
  async function loadSessions() { try { const r = await fetch("/api/gacha"); const j = await r.json(); setSessions(j.data || []); } catch { /* ignore */ } }

  const setRate = (k: Rarity, v: number) => setRates({ ...rates, [k]: Math.max(0, v || 0) });
  function addItem() { const n = itName.trim(); if (!n || pool.some((p) => p.name === n && p.rarity === itRar)) return; setPool([...pool, { name: n, rarity: itRar }]); setItName(""); }
  const delItem = (i: number) => setPool(pool.filter((_, idx) => idx !== i));

  function runSim() {
    setErr("");
    if (!rateOk) return setErr("rate รวมต้อง = 100% ก่อนสุ่ม");
    if (missing.length) return setErr("เพิ่ม item ให้ครบ rarity: " + missing.join(", "));
    const n = Math.floor(sRolls); if (!(n > 0) || n > 500000) return setErr("จำนวนครั้ง 1–500,000");
    const ctx: PityCtx = { on: pityOn, th: Math.max(1, Math.floor(pityTh || 90)), counter: pityC };
    const cnt: Record<Rarity, number> = { SSR: 0, SR: 0, R: 0, N: 0 }; const items: Record<string, number> = {}; const pull: typeof lastPull = [];
    for (let i = 1; i <= n; i++) {
      const rar = pickRarity(rates, ctx); const opts = pool.filter((p) => p.rarity === rar);
      const item = opts.length ? opts[Math.floor(Math.random() * opts.length)].name : "(ไม่มี item)";
      cnt[rar]++; items[item] = (items[item] || 0) + 1; pull.push({ roll: i, rarity: rar, item, cost: sPrice });
    }
    setPityC(ctx.counter);
    setSim({ n, cnt, cost: n * sPrice });
    setLastPull(pull);
    setHist([{ t: new Date().toLocaleTimeString("th-TH"), n, ...cnt, cost: n * sPrice }, ...hist].slice(0, 10));
  }

  async function runMC() {
    setErr("");
    if (!rateOk) return setErr("rate รวมต้อง = 100% ก่อน");
    if (missing.length) return setErr("item pool ยังไม่ครบ rarity: " + missing.join(", "));
    const ns = Math.floor(sims); const { paid, free, total: tot } = computeRolls(budget, price, freeOn, freeX, freeY);
    if (!(price > 0)) return setErr("ราคาต่อ roll ต้อง > 0");
    if (!(ns > 0) || ns > 100000) return setErr("จำนวน simulation 1–100,000");
    if (!(tot > 0)) return setErr("งบไม่พอสุ่มเลย (paid rolls = 0)");
    const th = Math.max(1, Math.floor(pityTh || 90));
    const dist: Record<string, number> = {}; let sum = 0, atLeast1 = 0, best = 0, worst = Infinity;
    for (let s = 0; s < ns; s++) {
      const ctx: PityCtx = { on: pityOn, th, counter: 0 }; let c = 0;
      for (let i = 0; i < tot; i++) if (pickRarity(rates, ctx) === "SSR") c++;
      sum += c; if (c >= 1) atLeast1++; if (c > best) best = c; if (c < worst) worst = c;
      const key = c >= 4 ? "4+" : "" + c; dist[key] = (dist[key] || 0) + 1;
    }
    const chance1 = (atLeast1 / ns) * 100, avg = sum / ns;
    setMc({ paid, free, total: tot, chance1, avg, best, worst: worst === Infinity ? 0 : worst, dist, sims: ns, budget, price });
    try {
      await fetch("/api/gacha", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ pulls: tot, ssr_count: Math.round(avg), ssr_rate: rates.SSR, pity: pityOn ? th : 0, spent: budget, config: `${ns} sims · SSR ${rates.SSR}% · ${chance1.toFixed(1)}% ได้≥1` }),
      });
      loadSessions();
    } catch { /* DB optional */ }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {err && <div className="gmsg err">⚠ {err}</div>}

      <div className="card">
        <h4>① Rate Settings</h4>
        <div className="rates">
          {RAR.map((k) => (
            <div className={`ratebox ${k}`} key={k}>
              <div className="rtag">{k}</div>
              <input type="number" min="0" step="0.1" value={rates[k]} onChange={(e) => setRate(k, +e.target.value)} />
            </div>
          ))}
        </div>
        <div className={`totbadge ${rateOk ? "ok" : "bad"}`}>{rateOk ? `✓ รวม ${fmt(total)}% — ครบ 100%` : `✗ รวม ${fmt(total)}% — ต้อง = 100%`}</div>
      </div>

      <div className="card">
        <h4>② Item Pool</h4>
        <div className="inputrow">
          <div style={{ flex: 2 }}><label>ชื่อ Item</label><input value={itName} onChange={(e) => setItName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="เช่น Aurora" /></div>
          <div><label>Rarity</label><select value={itRar} onChange={(e) => setItRar(e.target.value as Rarity)}>{RAR.map((k) => <option key={k}>{k}</option>)}</select></div>
          <div style={{ flex: "0 0 auto" }}><button className="btn" onClick={addItem}>+ เพิ่ม</button></div>
        </div>
        {missing.length > 0 && <div className="gmsg err">⚠ rarity ที่มี rate &gt; 0 แต่ยังไม่มี item: {missing.join(", ")}</div>}
        <div className="tablewrap" style={{ marginTop: 12 }}>
          <table>
            <thead><tr><th>Item</th><th>Rarity</th><th style={{ textAlign: "right" }}>จัดการ</th></tr></thead>
            <tbody>{pool.map((it, i) => (
              <tr key={i}><td>{it.name}</td><td><span className={`gchip ${it.rarity}`}>{it.rarity}</span></td>
                <td style={{ textAlign: "right" }}><button className="btn ghost" style={{ padding: "4px 12px", fontSize: ".8rem" }} onClick={() => delItem(i)}>ลบ</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h4>③ Single Simulation</h4>
        <div className="inputrow">
          <div><label>จำนวนครั้ง</label><input type="number" min="1" value={sRolls} onChange={(e) => setSRolls(+e.target.value)} /></div>
          <div><label>ราคา/ครั้ง</label><input type="number" min="0" value={sPrice} onChange={(e) => setSPrice(+e.target.value)} /></div>
          <div style={{ flex: "0 0 auto" }}><button className="btn" onClick={runSim}>🎲 สุ่ม</button></div>
        </div>
        <div className="flexbtw" style={{ marginTop: 12 }}>
          <label className="toggle"><input type="checkbox" checked={pityOn} onChange={(e) => setPityOn(e.target.checked)} /><span className="sw" />Pity System</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="hint">การันตี SSR ทุก</span><input type="number" min="1" value={pityTh} onChange={(e) => setPityTh(+e.target.value)} style={mini} /><span className="hint">โรล · counter: {pityC}</span></div>
        </div>
        {sim && (
          <div style={{ marginTop: 14 }}>
            <div className="stats">
              <div className="stat"><div className="stat-n">{fmt(sim.n)}</div><div className="stat-l">Roll</div></div>
              <div className="stat"><div className="stat-n">{fmt(sim.cost)}</div><div className="stat-l">ค่าใช้จ่าย</div></div>
              <div className="stat"><div className="stat-n">{fmt(sim.cnt.SSR)}</div><div className="stat-l">SSR</div></div>
              <div className="stat"><div className="stat-n">{(["SSR", "SR", "R", "N"] as Rarity[]).reduce((a, b) => (sim.cnt[a] >= sim.cnt[b] ? a : b))}</div><div className="stat-l">ออกมากสุด</div></div>
            </div>
            <div style={{ margin: "10px 0" }}>{RAR.map((k) => { const pc = (sim.cnt[k] / sim.n) * 100; return (
              <div className="gbar" key={k}><span className="gbl"><span className={`gchip ${k}`}>{k}</span></span><div className="gtrack"><div className="gfill" style={{ width: `${pc}%`, background: RCOL[k] }} /></div><span className="gbval">{fmt(pc)}%</span></div>
            ); })}</div>
            <button className="btn ghost" style={{ fontSize: ".85rem" }} onClick={() => downloadCSV("latest_pull.csv", [["roll_no", "rarity", "item", "cost"], ...lastPull.map((p) => [p.roll, p.rarity, p.item, p.cost])])}>⬇ Export Pull CSV</button>
          </div>
        )}
        {hist.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="flexbtw"><div className="sub">History (10 ล่าสุด)</div><button className="btn ghost" style={{ padding: "3px 12px", fontSize: ".78rem" }} onClick={() => setHist([])}>🗑 ล้างประวัติ</button></div>
            <div className="tablewrap"><table>
              <thead><tr><th>เวลา</th><th>โรล</th><th>SSR</th><th>SR</th><th>R</th><th>N</th><th>ค่าใช้จ่าย</th></tr></thead>
              <tbody>{hist.map((h, i) => <tr key={i}><td>{h.t}</td><td>{fmt(h.n)}</td><td>{fmt(h.SSR)}</td><td>{fmt(h.SR)}</td><td>{fmt(h.R)}</td><td>{fmt(h.N)}</td><td>{fmt(h.cost)}</td></tr>)}</tbody>
            </table></div>
          </div>
        )}
      </div>

      <div className="card">
        <h4>④ Player POV — Monte Carlo</h4>
        <p className="sub">ถ้าเติมเงินเท่านี้ มีโอกาสได้ SSR แค่ไหน (รันหลายพันรอบแล้วเฉลี่ย)</p>
        <div className="inputrow">
          <div><label>งบ (บาท)</label><input type="number" min="0" value={budget} onChange={(e) => setBudget(+e.target.value)} /></div>
          <div><label>ราคา/roll</label><input type="number" min="1" value={price} onChange={(e) => setPrice(+e.target.value)} /></div>
          <div><label>จำนวน sim</label><input type="number" min="1" max="100000" value={sims} onChange={(e) => setSims(+e.target.value)} /></div>
        </div>
        <div className="flexbtw" style={{ marginTop: 12 }}>
          <label className="toggle"><input type="checkbox" checked={freeOn} onChange={(e) => setFreeOn(e.target.checked)} /><span className="sw" />Free Roll</label>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span className="hint">ครบ</span><input type="number" min="1" value={freeX} onChange={(e) => setFreeX(+e.target.value)} style={mini} /><span className="hint">paid → ฟรี</span><input type="number" min="0" value={freeY} onChange={(e) => setFreeY(+e.target.value)} style={mini} /><span className="hint">roll</span></div>
        </div>
        <button className="btn" style={{ marginTop: 12 }} onClick={runMC}>📊 Run Monte Carlo</button>
        {mc && (
          <div style={{ marginTop: 14 }}>
            <div className="stats">
              <div className="stat"><div className="stat-n">{fmt(mc.total)}</div><div className="stat-l">Total Rolls</div></div>
              <div className="stat"><div className="stat-n">{fmt(mc.chance1)}%</div><div className="stat-l">โอกาส SSR ≥ 1</div></div>
              <div className="stat"><div className="stat-n">{fmt(mc.avg)}</div><div className="stat-l">เฉลี่ย SSR/รอบ</div></div>
              <div className="stat"><div className="stat-n">{mc.best}</div><div className="stat-l">ดีสุด</div></div>
            </div>
            <div className="insight2">เติม <b>{fmt(mc.budget)} บาท</b> ได้ <b>{fmt(mc.total)} rolls</b> ({fmt(mc.paid)} paid + {fmt(mc.free)} free) · จำลอง <b>{fmt(mc.sims)} รอบ</b>: โอกาส <b>{fmt(mc.chance1)}%</b> ได้ SSR ≥ 1 · เฉลี่ย <b>{fmt(mc.avg)}</b> SSR/รอบ · ดีสุด {mc.best} แย่สุด {mc.worst}</div>
            <div style={{ margin: "12px 0" }}>{["0", "1", "2", "3", "4+"].map((k) => {
              const v = mc.dist[k] || 0; const mx = Math.max(...["0", "1", "2", "3", "4+"].map((kk) => mc.dist[kk] || 0), 1);
              return (<div className="gbar" key={k}><span className="gbl">{k} SSR</span><div className="gtrack"><div className="gfill" style={{ width: `${(v / mx) * 100}%`, background: k === "0" ? "#8390a3" : "#ffbf47" }} /></div><span className="gbval">{fmt((v / mc.sims) * 100)}%</span></div>);
            })}</div>
            <button className="btn ghost" style={{ fontSize: ".85rem" }} onClick={() => downloadCSV("player_pov.csv", [["metric", "value"], ["budget", mc.budget], ["price", mc.price], ["paid", mc.paid], ["free", mc.free], ["total", mc.total], ["sims", mc.sims], ["chance_ge1_ssr_%", mc.chance1.toFixed(2)], ["avg_ssr", mc.avg.toFixed(3)], ["best", mc.best], ["worst", mc.worst]])}>⬇ Export Summary CSV</button>
          </div>
        )}
        {sessions.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="sub">💾 Session ที่บันทึกไว้ (Turso DB)</div>
            <div className="tablewrap"><table>
              <thead><tr><th>เวลา</th><th>Rolls</th><th>งบ</th><th>SSR rate</th><th>หมายเหตุ</th></tr></thead>
              <tbody>{sessions.map((s, i) => (
                <tr key={i}><td style={{ whiteSpace: "nowrap" }}>{String(s.created_at ?? "").slice(0, 16)}</td><td>{fmt(Number(s.pulls))}</td><td>{fmt(Number(s.spent))}</td><td>{String(s.ssr_rate)}%</td><td style={{ color: "var(--muted)" }}>{String(s.config ?? "")}</td></tr>
              ))}</tbody>
            </table></div>
          </div>
        )}
      </div>
    </div>
  );
}
