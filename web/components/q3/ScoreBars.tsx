import { SCORING, type Scores } from "@/lib/types";

export default function ScoreBars({ scores }: { scores: Scores }) {
  return (
    <div className="bars">
      {SCORING.map((s) => {
        const v = scores[s.key] ?? 0;
        const pct = Math.round((v / s.weight) * 100);
        return (
          <div className="bar-row" key={s.key}>
            <span className="bar-label">{s.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="bar-val">
              {v.toFixed(1)}/{s.weight}
            </span>
          </div>
        );
      })}
    </div>
  );
}
