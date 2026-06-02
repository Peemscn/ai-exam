"use client";

import { useCallback, useEffect, useState } from "react";
import type { Feedback } from "@/lib/types";

const sentClass = (s: string) => (s === "Negative" ? "neg" : s === "Neutral" ? "neu" : "pos");
const prioClass = (p: string) => (p === "High" ? "high" : p === "Medium" ? "med" : "low");
const LIMIT = 15;
const COLS = 6;

export default function FeedbackTable() {
  const [rows, setRows] = useState<Feedback[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sent, setSent] = useState("");
  const [prio, setPrio] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/feedback?by=category")
      .then((r) => r.json())
      .then((j) => setCats((j.data || []).map((g: { label: string }) => g.label)))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (q) p.set("q", q);
    if (cat) p.set("category", cat);
    if (sent) p.set("sentiment", sent);
    if (prio) p.set("priority", prio);
    try {
      const r = await fetch("/api/feedback?" + p.toString());
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      setRows(j.data || []);
      setTotal(j.meta?.total || 0);
      setPages(j.meta?.pages || 1);
      setSrc(j.meta?.source || "");
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [page, q, cat, sent, prio]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="controls">
        <input aria-label="ค้นหา feedback" placeholder="🔍 ค้นหา summary / theme / ID…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select aria-label="กรองหมวด" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }}>
          <option value="">ทุกหมวด</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="กรอง sentiment" value={sent} onChange={(e) => { setSent(e.target.value); setPage(1); }}>
          <option value="">ทุก sentiment</option>
          <option>Negative</option><option>Neutral</option><option>Positive</option>
        </select>
        <select aria-label="กรอง priority" value={prio} onChange={(e) => { setPrio(e.target.value); setPage(1); }}>
          <option value="">ทุก priority</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <span className="count">{loading ? "…" : `${total} รายการ`}</span>
        {src && <span className={`srcbadge ${src}`}>{src}</span>}
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Summary (AI)</th><th>หมวด</th><th>Sentiment</th><th>Priority</th><th>Owner</th></tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={COLS}><div className="errbox">⚠ {error}<br /><button className="pgbtn" onClick={load}>ลองใหม่</button></div></td></tr>
            ) : loading && rows.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: COLS }).map((_, j) => <td key={j}><div className="skeleton" /></td>)}</tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS} style={{ textAlign: "center", color: "var(--muted)", padding: 30 }}>ไม่พบรายการ</td></tr>
            ) : (
              rows.map((d) => (
                <tr key={d.feedback_id}>
                  <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{d.feedback_id}</td>
                  <td className="namecell">{d.ai_summary}<small>{d.matched_theme}</small></td>
                  <td style={{ whiteSpace: "nowrap" }}>{d.category}</td>
                  <td><span className={`badge ${sentClass(d.sentiment)}`}>{d.sentiment}</span></td>
                  <td><span className={`badge ${prioClass(d.priority)}`}>{d.priority}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>{d.suggested_owner}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="pginfo">หน้า {page}/{pages} · {total} รายการ</span>
        <div className="pgbtns">
          <button className="pgbtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>← ก่อนหน้า</button>
          <button className="pgbtn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages || loading}>ถัดไป →</button>
        </div>
      </div>
    </div>
  );
}
