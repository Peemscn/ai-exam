export const fmtDist = (m: number | null): string =>
  m == null ? "—" : m < 1000 ? `${m} ม.` : `${(m / 1000).toFixed(1)} กม.`;

export const fmtReviews = (n: number): string => n.toLocaleString("en-US");

export const medal = (i: number): string => ["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`;

export const totalClass = (total: number): "good" | "ok" | "warn" =>
  total >= 75 ? "good" : total >= 60 ? "ok" : "warn";

export const rankClass = (rank: number): string =>
  rank <= 3 ? `r${rank}` : "";
