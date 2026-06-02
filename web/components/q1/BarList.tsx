export default function BarList({
  items,
  color,
}: {
  items: { label: string; value: number; suffix?: string }[];
  color?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars">
      {items.map((i) => (
        <div className="bar-row" key={i.label}>
          <span className="bar-label" title={i.label}>
            {i.label}
          </span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(i.value / max) * 100}%`, ...(color ? { background: color } : {}) }}
            />
          </div>
          <span className="bar-val">
            {i.value}
            {i.suffix ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}
