// Lightweight inline-SVG donut + pie. No external deps.

export type Slice = { label: string; value: number; color?: string };

const PALETTE = ["#1a73e8", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

export function DonutChart({ data, size = 200, thickness = 36, totalLabel }: {
  data: Slice[]; size?: number; thickness?: number; totalLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="text-xs text-slate-400 italic">No data</div>;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const a0 = (acc / total) * 2 * Math.PI - Math.PI / 2;
    acc += d.value;
    const a1 = (acc / total) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    return {
      slice: d, color: d.color ?? PALETTE[i % PALETTE.length],
      d: `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
    };
  });

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Donut chart">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} stroke={a.color} strokeWidth={thickness} fill="none" />
        ))}
        <text x={cx} y={cy} fill="#0f172a" fontSize={18} fontWeight={600} textAnchor="middle">{total}</text>
        {totalLabel && (
          <text x={cx} y={cy + 14} fill="#64748b" fontSize={9} textAnchor="middle">{totalLabel}</text>
        )}
      </svg>
      <ul className="text-xs space-y-1 min-w-[140px]">
        {data.map((d, i) => {
          const c = d.color ?? PALETTE[i % PALETTE.length];
          const pct = Math.round((d.value / total) * 100);
          return (
            <li key={i} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ background: c }} />
              <span className="flex-1 text-slate-700 truncate">{d.label}</span>
              <span className="tabular-nums text-slate-500">{d.value}</span>
              <span className="tabular-nums text-slate-400 w-10 text-right">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
