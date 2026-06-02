"use client";

import { useState } from "react";
import type { Sample } from "./DataSourceCompare";

type Step = { icon: string; text: string; ms: number; tone?: "warn" | "good" };

// replay process chromium scrape จาก run จริง (sample_chromium.json) — โชว์ว่า headless ได้แค่ lite
export default function ChromiumReplay({ rows }: { rows: Sample[] }) {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);

  const n = rows.length;
  const cov = (k: keyof Sample) => rows.filter((r) => r[k] != null && r[k] !== "").length;
  const steps: Step[] = [
    { icon: "🌐", text: `navigate → google.com/maps/search "สยาม restaurants"`, ms: 650 },
    { icon: "🤖", text: `set UA จริง + ปิด navigator.webdriver (เลี่ยง bot detection)`, ms: 600 },
    { icon: "⏳", text: `waitForSelector div.Nv2PK — รอ card แรก render`, ms: 700 },
    { icon: "📜", text: `scroll feed ×8 (Maps = virtual list, lazy load)`, ms: 900 },
    { icon: "🔍", text: `grab DOM cards → เก็บได้ ${n} ร้าน`, ms: 750 },
    { icon: "📊", text: `coverage: rating ${cov("rating")}/${n} · price ${cov("price")}/${n} · address ${cov("address")}/${n} · hours ${cov("hours")}/${n}`, ms: 850 },
    { icon: "⚠️", text: `address 0/${n} + hours 0/${n} — headless โดน Maps ส่ง "lite DOM" (ตัด field ทิ้ง)`, ms: 850, tone: "warn" },
    { icon: "🔁", text: `ลอง UA spoof / headful+xvfb / persistent context+consent → ก็ยัง lite`, ms: 800, tone: "warn" },
    { icon: "✅", text: `→ เปลี่ยนไป Apify REST (browser farm render เต็ม) → ครบทุก field reliable`, ms: 0, tone: "good" },
  ];

  async function play() {
    if (playing) return;
    setPlaying(true);
    setShown(0);
    for (let i = 0; i < steps.length; i++) {
      setShown(i + 1);
      await new Promise((r) => setTimeout(r, steps[i].ms));
    }
    setPlaying(false);
  }

  const color = (t?: Step["tone"]) => (t === "warn" ? "var(--warn)" : t === "good" ? "var(--good)" : "var(--text)");

  return (
    <div style={{ marginTop: 12 }}>
      <button className="btn ghost" onClick={play} disabled={playing} style={{ width: "100%" }}>
        {playing ? "⏳ กำลัง replay…" : shown > 0 ? "🔁 เล่นซ้ำ chromium scrape" : "▶ ดู chromium scrape (step-by-step)"}
      </button>

      {shown > 0 && (
        <div style={{ marginTop: 10, fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: "0.76rem", background: "var(--bg)", borderRadius: 8, padding: "10px 12px", lineHeight: 1.85 }}>
          {steps.slice(0, shown).map((s, i) => (
            <div key={i} style={{ color: color(s.tone), opacity: i === shown - 1 ? 1 : 0.82 }}>
              <span style={{ opacity: 0.5 }}>{String(i + 1).padStart(2, "0")}</span> {s.icon} {s.text}
            </div>
          ))}
        </div>
      )}

      {shown >= steps.length && (
        <div style={{ marginTop: 10, fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.6 }}>
          <p style={{ margin: "6px 0" }}>
            <b style={{ color: "var(--text)" }}>ทำไม headless ได้แค่นี้:</b> Google Maps ตรวจจับ headless → ส่ง DOM ย่อ (lite) เพื่อกัน bot — rating/price ติดมาบางส่วน (ใน aria-label + text) แต่ <b>address/hours ถูกตัด</b> (โหลด lazy เฉพาะตอน interact จริง)
          </p>
          <p style={{ margin: "6px 0" }}>
            <b style={{ color: "var(--text)" }}>ทำไมเปลี่ยน Apify:</b> Apify ใช้ browser farm + proxy render เต็มเหมือนคนใช้จริง → ได้ครบทุก field (address/hours/website) + reliable ไม่ต้องสู้ anti-bot เอง
          </p>
          <p style={{ margin: "6px 0", opacity: 0.7, fontSize: "0.74rem" }}>
            🔁 replay จาก scrape จริง (<code>data/sample_chromium.json</code>) — rerun เอง: <code>bun scripts/scrape-sample.mjs</code>
          </p>
        </div>
      )}
    </div>
  );
}
