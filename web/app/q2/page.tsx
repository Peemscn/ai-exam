import GachaSim from "@/components/q2/GachaSim";

export const metadata = { title: "Q2 · Gacha Drop Simulator" };

export default function Q2Page() {
  return (
    <main>
      <header className="hero">
        <h1>
          🎰 <span className="grad">Gacha Drop Simulator</span>
        </h1>
        <p>จำลองอัตราดรอป gacha — มุมมองระบบ + ผู้เล่น (Monte Carlo) · pity · free roll · CSV · บันทึกลง DB</p>
        <div className="pills">
          <span className="pill">🎲 Single sim</span>
          <span className="pill">📊 Monte Carlo</span>
          <span className="pill">🛡️ Pity system</span>
          <span className="pill">💾 Turso session</span>
        </div>
      </header>
      <div className="container">
        <section>
          <GachaSim />
        </section>
      </div>
    </main>
  );
}
