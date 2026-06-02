"use client";

import { useCallback, useEffect, useState } from "react";
import type { Restaurant } from "@/lib/types";
import { fmtDist, fmtReviews, totalClass, rankClass } from "@/lib/format";

const LIMIT = 12;
const COLS = 9;
const AREAS = ["สยาม", "อารีย์", "ทองหล่อ", "อโศก", "พร้อมพงษ์"];

export default function SearchTable() {
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState<"total" | "rating" | "dist" | "reviews">("total");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT), sort });
    if (q) p.set("q", q);
    if (area) p.set("area", area);
    try {
      const r = await fetch("/api/restaurants?" + p.toString());
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
  }, [page, q, area, sort]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [q, area, sort]);

  return (
    <div>
      <div className="controls">
        <input aria-label="ค้นหาร้าน" placeholder="🔍 ค้นหาชื่อร้าน / ประเภท / ที่อยู่…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="กรองพื้นที่" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">ทุกพื้นที่</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select aria-label="จัดเรียง" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="total">เรียงตามคะแนน</option>
          <option value="rating">เรียงตามเรตติ้ง</option>
          <option value="dist">เรียงตามระยะ</option>
          <option value="reviews">เรียงตามรีวิว</option>
        </select>
        <span className="count">{loading ? "…" : `${total} ร้าน`}</span>
        {src && <span className={`srcbadge ${src}`}>{src}</span>}
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>ร้าน</th><th>พื้นที่</th><th>ประเภท</th><th className="num">เรตติ้ง</th>
              <th className="num">รีวิว</th><th>ราคา</th><th className="num">ระยะ</th><th className="num">คะแนน</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={COLS}><div className="errbox">⚠ {error}<br /><button className="pgbtn" onClick={load}>ลองใหม่</button></div></td></tr>
            ) : loading && rows.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: COLS }).map((_, j) => <td key={j}><div className="skeleton" /></td>)}</tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS} style={{ textAlign: "center", color: "var(--muted)", padding: 30 }}>ไม่พบร้าน</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.name}>
                  <td><span className={`rankbadge ${rankClass(r.rank)}`}>{r.rank}</span></td>
                  <td className="namecell"><b>{r.name}</b>{r.address && <small>{r.address}</small>}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{r.area}</td>
                  <td>{r.category}</td>
                  <td className="num">⭐ {r.rating}</td>
                  <td className="num">{fmtReviews(r.reviews)}</td>
                  <td>{r.price_text || "—"}</td>
                  <td className="num">{fmtDist(r.distance_m)}</td>
                  <td className="num"><span className={`totalpill ${totalClass(r.total)}`}>{r.total.toFixed(1)}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="pginfo">หน้า {page}/{pages} · {total} ร้าน</span>
        <div className="pgbtns">
          <button className="pgbtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>← ก่อนหน้า</button>
          <button className="pgbtn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages || loading}>ถัดไป →</button>
        </div>
      </div>
    </div>
  );
}
