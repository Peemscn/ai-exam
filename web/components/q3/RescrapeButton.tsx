"use client";

import { useState } from "react";

export default function RescrapeButton() {
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function rescrape() {
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/scrape", { method: "POST" });
      const j = await r.json();
      if (j.data?.msg) {
        setOk(true);
        setMsg(j.data.msg);
      } else {
        setOk(false);
        setMsg(j.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      setOk(false);
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat">
      <p style={{ color: "var(--muted)", marginBottom: 14 }}>
        กด re-scrape Google Maps สด — <strong>local (dev):</strong> scrape จริงเลย (รัน Playwright + pipeline + reseed DB, ~1-2 นาที) ·
        <strong> production:</strong> trigger GitHub Action CI แล้ว redeploy
      </p>
      <button className="btn ghost" onClick={rescrape} disabled={loading}>
        {loading ? "⏳ กำลัง scrape… (อาจ 1-2 นาที)" : "🔄 Re-scrape ข้อมูลสด"}
      </button>
      {msg && <div className={`msg ${ok ? "ok" : "err"}`}>{ok ? "✓ " : "⚠ "}{msg}</div>}
    </div>
  );
}
