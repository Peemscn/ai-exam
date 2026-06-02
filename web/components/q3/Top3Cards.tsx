import type { Restaurant } from "@/lib/types";
import { fmtDist, fmtReviews, medal } from "@/lib/format";
import ScoreBars from "./ScoreBars";

export default function Top3Cards({ items }: { items: Restaurant[] }) {
  return (
    <div className="top3">
      {items.map((r, i) => (
        <div className={`t3card ${i === 0 ? "rank1" : ""}`} key={r.name}>
          <div className="scorebig">{r.total.toFixed(0)}</div>
          <div className="medal">{medal(i)}</div>
          <h3>{r.name}</h3>
          <div className="cat">
            {r.category} · {r.area}
          </div>
          <div className="meta">
            <span>
              ⭐ <b>{r.rating}</b> ({fmtReviews(r.reviews)})
            </span>
            <span>
              💰 <b>{r.price_text || "—"}</b>
            </span>
            <span>
              📍 <b>{fmtDist(r.distance_m)}</b>
            </span>
          </div>
          <ScoreBars scores={r.scores} />
          {r.source_maps && (
            <div style={{ marginTop: 12 }}>
              <a href={r.source_maps} target="_blank" rel="noreferrer">
                ดูบน Google Maps →
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
