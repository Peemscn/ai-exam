"use client";

import { useState } from "react";
import ChromiumReplay from "./ChromiumReplay";

export type Sample = {
  name: string;
  rating: number | null;
  reviews: number | null;
  price: string | null;
  address: string | null;
  hours: string | null;
};

const FIELDS: { k: keyof Sample; label: string }[] = [
  { k: "name", label: "ชื่อร้าน" },
  { k: "rating", label: "เรตติ้ง ★" },
  { k: "reviews", label: "จำนวนรีวิว" },
  { k: "price", label: "ช่วงราคา ฿" },
  { k: "address", label: "ที่อยู่" },
  { k: "hours", label: "เวลาเปิด" },
];

const coverage = (rows: Sample[], k: keyof Sample) =>
  rows.filter((r) => r[k] != null && r[k] !== "").length;

// top-level component (ไม่สร้างใน render — react-hooks/static-components)
function SourceColumn({ rows, lite, rescrape, loading, msg, ok }: {
  rows: Sample[];
  lite: boolean;
  rescrape: () => void;
  loading: boolean;
  msg: string;
  ok: boolean;
}) {
  return (
    <div className="card" style={{ borderColor: lite ? "var(--warn)" : "var(--good)", borderWidth: 1, borderStyle: "solid" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span className="pill" style={{ background: lite ? "var(--warn)" : "var(--good)", color: "#fff", border: "none" }}>
          {lite ? "⚠ lite DOM" : "✓ full data"}
        </span>
        <h4 style={{ margin: 0 }}>{lite ? "chromium / Playwright" : "Apify Google Maps"}</h4>
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 12 }}>
        {lite
          ? "headless scrape DOM — ได้ rating/reviews/price บางส่วน แต่ขาดที่อยู่/เวลาเปิด + ต้อง scroll เอง ไม่ครบทุกร้าน"
          : "actor compass/crawler-google-places · render เต็ม → ดึงครบทุก field"}
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <tbody>
          {FIELDS.map((f) => {
            const n = coverage(rows, f.k);
            const got = n > 0;
            return (
              <tr key={f.k} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "5px 4px" }}>{f.label}</td>
                <td style={{ padding: "5px 4px", textAlign: "center", color: got ? "var(--good)" : "var(--warn)", fontWeight: 700 }}>
                  {got ? "✓" : "✗"}
                </td>
                <td style={{ padding: "5px 4px", textAlign: "right", color: "var(--muted)", fontSize: "0.78rem" }}>
                  {n}/{rows.length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {lite ? (
        <ChromiumReplay rows={rows} />
      ) : (
        <>
          {rows.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: "0.8rem" }}>
                ดูตัวอย่างข้อมูลดิบ {Math.min(3, rows.length)} ร้าน (ย่านสยาม)
              </summary>
              <pre style={{ fontSize: "0.7rem", overflow: "auto", marginTop: 6, background: "var(--bg)", padding: 8, borderRadius: 6 }}>
                {JSON.stringify(rows.slice(0, 3), null, 1)}
              </pre>
            </details>
          )}
          <div style={{ marginTop: 12 }}>
            <button className="btn ghost" onClick={rescrape} disabled={loading}>
              {loading ? "⏳ กำลัง scrape สด… (Apify ~2-4 นาที)" : "🔄 re-scrape สด (ยิง Apify → อัปเดต DB)"}
            </button>
            {msg && <div className={`msg ${ok ? "ok" : "err"}`} style={{ marginTop: 8 }}>{ok ? "✓ " : "⚠ "}{msg}</div>}
          </div>
        </>
      )}
    </div>
  );
}

export default function DataSourceCompare({ chromium, apify }: { chromium: Sample[]; apify: Sample[] }) {
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
      if (j.data?.msg) { setOk(true); setMsg(j.data.msg); }
      else { setOk(false); setMsg(j.error?.message || "เกิดข้อผิดพลาด"); }
    } catch (e) {
      setOk(false);
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="cardgrid">
        <SourceColumn rows={chromium} lite={true} rescrape={rescrape} loading={loading} msg={msg} ok={ok} />
        <SourceColumn rows={apify} lite={false} rescrape={rescrape} loading={loading} msg={msg} ok={ok} />
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: 14 }}>
        💾 หน้านี้แสดงข้อมูลจาก <strong>DB (Turso)</strong> ที่ scrape ไว้แล้ว — ไม่กดปุ่มก็มีข้อมูลครบ ไม่เปลือง Apify quota ·
        กด <strong>re-scrape</strong> เมื่ออยากดึงสดใหม่ → ยิง Apify REST API → clean + score → อัปเดต DB → รีเฟรชเห็นทันที
      </p>
    </>
  );
}
