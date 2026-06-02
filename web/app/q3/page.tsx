import { getScoredRestaurants } from "@/lib/restaurants";
import { SCORING } from "@/lib/types";
import Stats from "@/components/q3/Stats";
import Top3Cards from "@/components/q3/Top3Cards";
import Top10Table from "@/components/q3/Top10Table";
import SearchTable from "@/components/q3/SearchTable";
import AIChat from "@/components/q3/AIChat";
import DataSourceCompare from "@/components/q3/DataSourceCompare";
import chromiumRaw from "@/data/sample_chromium.json";
import mapsRaw from "@/data/raw_maps.json";

export const dynamic = "force-dynamic"; // query Turso สดทุก request → sync กับ re-scrape

export const metadata = {
  title: "Q3 · AI Food Assistant — ร้านมื้อทีม ย่านอโศก",
};

const METHOD: Record<string, string> = {
  rating_review: "เรตติ้ง × จำนวนรีวิว (ถ่วงน้ำหนักความน่าเชื่อถือ)",
  group_suitability: "เหมาะกับกลุ่ม 8-12 คน (ประเภทร้าน/ที่นั่ง)",
  price_suitability: "ราคาเหมาะงบมื้อทีม",
  travel_convenience: "ใกล้ BTS อโศก / MRT สุขุมวิท",
  data_completeness: "ข้อมูลครบ (ที่อยู่/เวลา/เว็บ/พิกัด)",
  uniqueness: "จุดเด่น/ความหลากหลายเมนู",
};

export default async function Q3Page() {
  const all = await getScoredRestaurants();
  const top3 = all.slice(0, 3);
  const top10 = all.slice(0, 10);

  // ตัวอย่างเทียบ 2 แหล่ง scrape (ย่านสยาม) — chromium headless vs Apify
  type Src = { name: string; rating?: number | null; reviews?: number | null; price?: string | null; address?: string | null; hours?: string | null; area?: string };
  const toSample = (r: Src) => ({ name: r.name, rating: r.rating ?? null, reviews: r.reviews ?? null, price: r.price ?? null, address: r.address ?? null, hours: r.hours ?? null });
  const chromiumSample = (chromiumRaw as Src[]).map(toSample);
  const apifySample = (mapsRaw as Src[]).filter((r) => r.area === "สยาม").map(toSample);

  return (
    <main>
      <header className="hero">
        <h1>
          🍽️ <span className="grad">AI Food Assistant</span>
        </h1>
        <p>หาร้านอาหารมื้อทีม 8-12 คน 5 ย่าน (สยาม · อารีย์ · ทองหล่อ · อโศก · พร้อมพงษ์) — scrape จริง + AI scoring + ถาม AI สด</p>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 6 }}>โดย DEV : PEEM · มิถุนายน 2026</p>
        <div className="pills">
          <span className="pill">📍 5 ย่าน</span>
          <span className="pill">🗂️ {all.length} ร้าน</span>
          <span className="pill">🔗 Google Maps + OSM</span>
          <span className="pill">🤖 Claude AI</span>
        </div>
      </header>

      <div className="container">
        <Stats data={all} />

        <section>
          <h2>🎯 เป้าหมาย</h2>
          <p className="sub">ทีม 8-12 คนต้องเลือกร้านมื้อเย็น 1-3 ร้านจาก 5 ย่าน — ร้านไหนเหมาะสุด เพราะอะไร? Workflow นี้ scrape ข้อมูลจริง → ให้คะแนน → แนะนำพร้อมเหตุผล</p>
        </section>

        <section>
          <h2>🔄 ภาพรวม Workflow</h2>
          <div className="flow">
            {[
              "1 · Scrape — Apify Google Maps + OSM (5 ย่าน, 2 แหล่ง)",
              "2 · Clean — รวม / normalize / dedupe (ราคา-พิกัด-ระยะ)",
              "3 · Score — AI scoring 100 คะแนน (6 เกณฑ์)",
              "4 · Analysis — Claude วิเคราะห์ ranking + trade-off",
              "5 · Report — Next.js + Turso DB (หน้านี้)",
            ].map((s, i) => (
              <div className="flowstep" key={i}>{s}</div>
            ))}
          </div>
        </section>

        <section>
          <h2>🛠️ เครื่องมือที่ใช้</h2>
          <div className="pills">
            {["Apify (Google Maps Scraper)", "OpenStreetMap Overpass", "Claude AI", "Next.js 16 + React 19", "Turso (libSQL)", "TypeScript / Python (clean·score)", "Vercel"].map((t) => (
              <span className="pill" key={t}>{t}</span>
            ))}
          </div>
        </section>

        <section>
          <h2>📚 แหล่งข้อมูล (2 แหล่ง · ตรวจย้อนกลับได้)</h2>
          <div className="cardgrid">
            <div className="card">
              <h4>1. Google Maps (ผ่าน Apify)</h4>
              <p>เรตติ้ง · จำนวนรีวิว · ช่วงราคา · เวลาเปิด · พิกัด — ลิงก์ Maps ต่อร้านอยู่ในตาราง</p>
              <a href="https://www.google.com/maps" target="_blank" rel="noreferrer">maps.google.com →</a>
            </div>
            <div className="card">
              <h4>2. OpenStreetMap Overpass</h4>
              <p>cuisine · เวลาเปิด · website (enrich เสริม Google Maps)</p>
              <a href="https://overpass-api.de" target="_blank" rel="noreferrer">overpass-api.de →</a>
            </div>
          </div>
        </section>

        <section>
          <h2>🏆 Top 3 ร้านแนะนำ</h2>
          <p className="sub">คะแนนรวมสูงสุดจาก 6 เกณฑ์ (เต็ม 100)</p>
          <Top3Cards items={top3} />
        </section>

        <section>
          <h2>⚖️ เปรียบเทียบ Top 3 (จุดเด่น / ข้อควรระวัง)</h2>
          <p className="sub">trade-off — ไม่ใช่ชมอย่างเดียว</p>
          <div className="cardgrid">
            {top3.map((r) => {
              const strong = SCORING.filter((s) => r.scores[s.key] / s.weight >= 0.8).map((s) => s.label);
              const weak = SCORING.filter((s) => r.scores[s.key] / s.weight < 0.6).map((s) => s.label);
              return (
                <div className="card" key={r.name}>
                  <h4>{r.name}</h4>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 8 }}>{r.category} · {r.area} · {r.total.toFixed(1)} คะแนน</p>
                  <div className="cmp"><span style={{ color: "var(--good)", fontWeight: 700 }}>✓ เด่น:</span> {strong.join(", ") || "—"}</div>
                  <div className="cmp"><span style={{ color: "var(--warn)", fontWeight: 700 }}>△ ควรดู:</span> {weak.join(", ") || "ครบทุกด้าน"}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2>📊 Top 10 Ranking</h2>
          <p className="sub">จัดอันดับตามคะแนนรวม</p>
          <Top10Table items={top10} />
        </section>

        <section>
          <h2>🔍 ค้นหา / กรองทั้งหมด</h2>
          <p className="sub">ค้นหา + จัดเรียง (server-side pagination ผ่าน API · {all.length} ร้าน)</p>
          <SearchTable />
        </section>

        <section>
          <h2>🤖 ถาม AI แนะนำร้าน</h2>
          <p className="sub">ถามเป็นภาษาคน — AI วิเคราะห์จากข้อมูลจริงทั้ง {all.length} ร้าน</p>
          <AIChat />
        </section>

        <section>
          <h2>🔬 แหล่งข้อมูล — chromium vs Apify (ทำไมเลือก Apify)</h2>
          <p className="sub">เทียบ 2 วิธี scrape Google Maps · ตัวอย่างจริงย่านสยาม · default แสดงจาก DB — กด re-scrape เพื่อยิง Apify อัปเดตสด</p>
          <DataSourceCompare chromium={chromiumSample} apify={apifySample} />
        </section>

        <section>
          <h2>📐 วิธีให้คะแนน (100 คะแนน)</h2>
          <p className="sub">6 เกณฑ์ ถ่วงน้ำหนักตามความสำคัญต่อมื้อทีม</p>
          <div className="method">
            {SCORING.map((s) => (
              <div className="mcard" key={s.key}>
                <div className="w">{s.weight}</div>
                <h4>{s.label}</h4>
                <p>{METHOD[s.key]}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
