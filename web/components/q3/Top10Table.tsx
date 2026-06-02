import type { Restaurant } from "@/lib/types";
import { fmtDist, fmtReviews, totalClass, rankClass } from "@/lib/format";

export default function Top10Table({ items }: { items: Restaurant[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ร้าน</th>
            <th>พื้นที่</th>
            <th>ประเภท</th>
            <th className="num">เรตติ้ง</th>
            <th className="num">รีวิว</th>
            <th>ราคา</th>
            <th className="num">ระยะ</th>
            <th className="num">คะแนน</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.name}>
              <td>
                <span className={`rankbadge ${rankClass(r.rank)}`}>{r.rank}</span>
              </td>
              <td className="namecell">
                <b>{r.name}</b>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>{r.area}</td>
              <td>{r.category}</td>
              <td className="num">⭐ {r.rating}</td>
              <td className="num">{fmtReviews(r.reviews)}</td>
              <td>{r.price_text || "—"}</td>
              <td className="num">{fmtDist(r.distance_m)}</td>
              <td className="num">
                <span className={`totalpill ${totalClass(r.total)}`}>{r.total.toFixed(1)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
