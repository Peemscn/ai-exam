import Link from "next/link";

const PROBLEMS = [
  {
    id: "q1",
    icon: "💬",
    title: "Player Feedback Insight",
    desc: "Classify feedback ผู้เล่นเกม 300 รายการ (sentiment / category / priority / owner) → insight + report ถ่วงน้ำหนักด้วย player segment",
    href: "/q1",
    tags: ["NLP classify", "300 records", "aggregate SQL"],
  },
  {
    id: "q2",
    icon: "🎰",
    title: "Gacha Drop Simulator",
    desc: "จำลองอัตราดรอป gacha: single sim, Monte Carlo (player POV), pity system, free roll, export CSV — บันทึก session ลง DB",
    href: "/q2",
    tags: ["Monte Carlo", "pity system", "session history"],
  },
  {
    id: "q3",
    icon: "🍽️",
    title: "AI Food Assistant",
    desc: "หาร้านมื้อทีม 8-12 คน 5 ย่าน (สยาม/อารีย์/ทองหล่อ/อโศก/พร้อมพงษ์): scrape (Maps + OSM) → scoring 100 → ถาม AI สด + re-scrape สด",
    href: "/q3",
    tags: ["web scrape", "AI scoring", "Claude Q&A"],
  },
];

export default function Home() {
  return (
    <main>
      <header className="hero">
        <h1>
          🧪 <span className="grad">AI Exam Lab</span>
        </h1>
        <p>3 โจทย์ AI Workflow Challenge — รวมเป็น fullstack เดียว · Next.js + Turso (SQLite) · DEV: PEEM</p>
        <div className="pills">
          <span className="pill">⚡ Next.js 15</span>
          <span className="pill">🗄️ Turso libSQL</span>
          <span className="pill">🤖 Claude AI</span>
          <span className="pill">▲ Vercel</span>
        </div>
      </header>

      <div className="container">
        <section>
          <div className="probs">
            {PROBLEMS.map((p) => (
              <Link href={p.href} className="probcard" key={p.id}>
                <div className="probicon">{p.icon}</div>
                <div className="probid">{p.id.toUpperCase()}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="probtags">
                  {p.tags.map((t) => (
                    <span className="pill" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <span className="probgo">เปิดดู →</span>
              </Link>
            ))}
          </div>
        </section>

        <footer>
          <p>
            AI Exam Lab · DEV : PEEM · มิถุนายน 2026 · source + deliverables ดูใน README (map แต่ละโจทย์)
          </p>
        </footer>
      </div>
    </main>
  );
}
