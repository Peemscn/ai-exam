import type { Restaurant } from "@/lib/types";

export default function Stats({ data }: { data: Restaurant[] }) {
  const n = data.length;
  const avgRating = n ? (data.reduce((s, r) => s + r.rating, 0) / n).toFixed(2) : "—";
  const avgTotal = n ? (data.reduce((s, r) => s + r.total, 0) / n).toFixed(1) : "—";
  const within500 = data.filter((r) => (r.distance_m ?? 1e9) <= 500).length;

  const items = [
    { n, l: "ร้านทั้งหมด" },
    { n: avgRating, l: "เรตติ้งเฉลี่ย" },
    { n: avgTotal, l: "คะแนนเฉลี่ย" },
    { n: within500, l: "ร้านใน 500 ม." },
  ];

  return (
    <div className="stats">
      {items.map((s, i) => (
        <div className="stat" key={i}>
          <div className="stat-n">{s.n}</div>
          <div className="stat-l">{s.l}</div>
        </div>
      ))}
    </div>
  );
}
