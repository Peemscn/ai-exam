"use client";

import { useEffect, useState } from "react";

const SUGGESTED = [
  "แนะนำร้านมื้อทีม 10 คน งบ 300-400 บาท/คน",
  "ร้านไหนเดินจาก BTS อโศกใกล้สุด เรตติ้งดี",
  "อยากได้ร้านบรรยากาศดี นั่งคุยงานได้",
  "ร้านอาหารญี่ปุ่นที่รีวิวเยอะที่สุด",
];

export default function AIChat() {
  const [q, setQ] = useState("");
  const [key, setKey] = useState("");
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // โหลด key จาก localStorage หลัง mount (client-only) — เลี่ยง hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKey(localStorage.getItem("anthropic_key") || "");
  }, []);

  function saveKey(v: string) {
    setKey(v);
    localStorage.setItem("anthropic_key", v);
  }

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setLoading(true);
    setErr("");
    setAnswer("");
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, apiKey: key }),
      });
      const j = await r.json();
      if (j.error) setErr(j.error.message || "เกิดข้อผิดพลาด");
      else setAnswer(j.data.answer);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat">
      <input
        className="keyinput"
        type="password"
        aria-label="Anthropic API key"
        placeholder="🔑 ไม่ใส่ก็ได้ (มี demo key) · หรือใส่ key เอง: Claude / OpenAI / Gemini"
        value={key}
        onChange={(e) => saveKey(e.target.value)}
        autoComplete="off"
      />
      <div className="chips">
        {SUGGESTED.map((s) => (
          <span
            key={s}
            className="chip"
            role="button"
            tabIndex={0}
            onClick={() => { setQ(s); ask(s); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQ(s); ask(s); }
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <textarea
        aria-label="พิมพ์คำถามถึง AI"
        placeholder="ถามอะไรก็ได้เกี่ยวกับร้านมื้อทีม… (AI ตอบจากข้อมูลจริง 90 ร้าน)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask(q);
        }}
      />
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => ask(q)} disabled={loading}>
          {loading ? "กำลังคิด…" : "ถาม AI"}
        </button>
        <span className="msg" style={{ marginLeft: 12 }}>
          Ctrl/⌘+Enter ส่ง · <b>ไม่ใส่ key = demo key ตอบเลย</b> · ใส่เอง: Claude (sk-ant-) / OpenAI (sk-) / Gemini (AIza) · เก็บในเครื่อง ไม่บันทึก
        </span>
      </div>
      {err && <div className="msg err">⚠ {err}</div>}
      {answer && <div className="answer">{answer}</div>}
    </div>
  );
}
