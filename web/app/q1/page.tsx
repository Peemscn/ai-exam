import insRaw from "@/data/feedback_insights.json";
import type { Insights } from "@/lib/types";
import BarList from "@/components/q1/BarList";
import FeedbackTable from "@/components/q1/FeedbackTable";

export const metadata = { title: "Q1 · Player Feedback Insight" };

const ins = insRaw as Insights;

const npItems = (rec: Record<string, { n: number; pct: number }>) =>
  Object.entries(rec).map(([label, v]) => ({ label, value: v.n, suffix: ` (${v.pct}%)` }));
const numItems = (rec: Record<string, number>) =>
  Object.entries(rec).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

export default function Q1Page() {
  const neg = ins.sentiment["Negative"];
  const stats = [
    { n: ins.total, l: "feedback ทั้งหมด" },
    { n: `${neg.pct}%`, l: "เชิงลบ" },
    { n: ins.high_priority_total, l: "Priority สูง" },
    { n: Object.keys(ins.category).length, l: "หมวดหมู่" },
  ];
  const segs = Object.entries(ins.segment_sentiment).sort((a, b) => b[1].neg_pct - a[1].neg_pct);
  const maxSegNeg = Math.max(...segs.map(([, v]) => v.neg_pct));

  return (
    <main>
      <header className="hero">
        <h1>
          💬 <span className="grad">Player Feedback Insight</span>
        </h1>
        <p>จัดหมวด + วิเคราะห์ feedback ผู้เล่นเกม {ins.total} รายการ (sentiment / category / priority / owner)</p>
        <div className="pills">
          <span className="pill">🎮 {ins.total} feedback</span>
          <span className="pill">🗓️ พ.ค. 2026</span>
          <span className="pill">🤖 AI classified</span>
        </div>
      </header>

      <div className="container">
        <div className="stats">
          {stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="stat-n">{s.n}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        <section>
          <h2>📊 การกระจายตัว</h2>
          <p className="sub">sentiment · priority · category · ทีมรับผิดชอบ</p>
          <div className="cardgrid">
            <div className="card">
              <h4>Sentiment</h4>
              <BarList items={npItems(ins.sentiment)} />
            </div>
            <div className="card">
              <h4>Priority</h4>
              <BarList items={npItems(ins.priority)} />
            </div>
            <div className="card">
              <h4>หมวดหมู่</h4>
              <BarList items={npItems(ins.category)} />
            </div>
            <div className="card">
              <h4>ทีมที่ควรรับผิดชอบ (owner)</h4>
              <BarList items={numItems(ins.owner)} color="linear-gradient(90deg,#7c5cff,#5b8cff)" />
            </div>
          </div>
        </section>

        <section>
          <h2>🔥 ปัญหาที่พบบ่อย (Top issues)</h2>
          <p className="sub">theme ที่ถูกพูดถึงมากสุด</p>
          <div className="cardgrid">
            <div className="card">
              <h4>Top themes</h4>
              {ins.top_issues.slice(0, 8).map((t) => (
                <div className="issue" key={t.theme}>
                  <div>
                    <div>{t.theme}</div>
                    <div className="imeta">{t.category} · {t.sentiment}</div>
                  </div>
                  <span className="icnt">{t.count}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h4>Priority สูง แยกตามหมวด ({ins.high_priority_total} รายการ)</h4>
              <BarList items={numItems(ins.high_priority_by_category)} color="var(--warn)" />
            </div>
          </div>
        </section>

        <section>
          <h2>👥 Sentiment ตาม Player Segment</h2>
          <p className="sub">% เชิงลบของแต่ละกลุ่มผู้เล่น (เรียงมาก→น้อย)</p>
          <div className="card">
            {segs.map(([seg, v]) => (
              <div className="segrow" key={seg}>
                <span className="bar-label" title={seg}>{seg}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(v.neg_pct / maxSegNeg) * 100}%`, background: "var(--warn)" }} />
                </div>
                <span className="bar-val">{v.neg_pct}%</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>⚠️ ความเสี่ยง & 💡 โอกาส</h2>
          <div className="cardgrid">
            <div className="card">
              <h4>ความเสี่ยง</h4>
              <div className="risk">
                <div>
                  <div className="riskn">{ins.risk_revenue.total_negative_monetization}</div>
                  <div className="imeta">feedback ลบเรื่องเงิน</div>
                </div>
                <div>
                  <div className="riskn">{ins.risk_revenue.from_paying_segments}</div>
                  <div className="imeta">จากกลุ่มจ่ายเงิน</div>
                </div>
                <div>
                  <div className="riskn">{ins.risk_retention.new_returning_negative}/{ins.risk_retention.new_returning_total}</div>
                  <div className="imeta">ผู้เล่นใหม่/กลับมา เชิงลบ</div>
                </div>
              </div>
            </div>
            <div className="card">
              <h4>โอกาส (เสียงชม)</h4>
              {ins.opportunity_positive.map((o) => (
                <div className="issue" key={o.theme}>
                  <div>{o.theme}</div>
                  <span className="icnt" style={{ color: "var(--good)" }}>{o.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2>🗂️ feedback ทั้งหมด ({ins.total} รายการ)</h2>
          <p className="sub">ค้นหา + กรอง หมวด/sentiment/priority (server-side pagination ผ่าน API)</p>
          <FeedbackTable />
        </section>

        <footer>
          <p>Q1 Player Feedback Insight · DEV : PEEM · AI classified ({ins.total} records)</p>
        </footer>
      </div>
    </main>
  );
}
