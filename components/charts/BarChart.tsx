// Lightweight inline-SVG bar chart. No external deps. Server-renderable.
// Used by reports so we don't ship a charting library to the client.

export type BarDatum = { label: string; value: number; max?: number; color?: string };

export function BarChart({
  data, height = 220, width = 600,
  yLabel, formatValue,
}: {
  data: BarDatum[];
  height?: number;
  width?: number;
  yLabel?: string;
  formatValue?: (v: number) => string;
}) {
  if (data.length === 0) return <div className="text-xs text-slate-400 italic">No data</div>;
  const maxVal = Math.max(1, ...data.map((d) => d.max ?? d.value));
  const padL = 50, padR = 12, padT = 16, padB = 56;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const slot = chartW / data.length;
  const barW = Math.max(8, slot * 0.62);
  const fmt = formatValue ?? ((v: number) => String(v));

  // Y-axis ticks (4 lines)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + chartH * (1 - t),
    label: fmt(Math.round(maxVal * t)),
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Bar chart">
      {/* Y-axis grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={width - padR} y2={t.y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray={i === 4 ? "" : "2 3"} />
          <text x={padL - 6} y={t.y + 3} fill="#64748b" fontSize={9} textAnchor="end">{t.label}</text>
        </g>
      ))}
      {yLabel && (
        <text x={6} y={padT - 4} fill="#64748b" fontSize={9} fontWeight={600}>{yLabel}</text>
      )}
      {/* Bars */}
      {data.map((d, i) => {
        const h = (d.value / maxVal) * chartH;
        const x = padL + i * slot + (slot - barW) / 2;
        const y = padT + chartH - h;
        const color = d.color ?? "#1a73e8";
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={3} fill={color} />
            {h > 16 && (
              <text x={x + barW / 2} y={y + 12} fill="#fff" fontSize={9} fontWeight={600} textAnchor="middle">{fmt(d.value)}</text>
            )}
            <text x={x + barW / 2} y={padT + chartH + 14} fill="#475569" fontSize={9} textAnchor="middle">
              {d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Stacked bar — used for correct/wrong split per topic.
export function StackedBarChart({
  data, height = 220, width = 600,
}: {
  data: { label: string; correct: number; total: number }[];
  height?: number; width?: number;
}) {
  if (data.length === 0) return <div className="text-xs text-slate-400 italic">No data</div>;
  const maxVal = Math.max(1, ...data.map((d) => d.total));
  const padL = 50, padR = 12, padT = 16, padB = 56;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const slot = chartW / data.length;
  const barW = Math.max(8, slot * 0.62);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Stacked bar chart">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + chartH * (1 - t);
        return <line key={i} x1={padL} y1={y} x2={width - padR} y2={y} stroke="#e2e8f0" strokeDasharray={i === 4 ? "" : "2 3"} />;
      })}
      {data.map((d, i) => {
        const totalH = (d.total / maxVal) * chartH;
        const correctH = (d.correct / maxVal) * chartH;
        const x = padL + i * slot + (slot - barW) / 2;
        const yWrong = padT + chartH - totalH;
        const yCorrect = padT + chartH - correctH;
        return (
          <g key={i}>
            <rect x={x} y={yWrong} width={barW} height={totalH - correctH} rx={2} fill="#fee2e2" />
            <rect x={x} y={yCorrect} width={barW} height={correctH} rx={2} fill="#10b981" />
            <text x={x + barW / 2} y={padT + chartH + 14} fill="#475569" fontSize={9} textAnchor="middle">
              {d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label}
            </text>
            <text x={x + barW / 2} y={yWrong - 4} fill="#475569" fontSize={9} textAnchor="middle">
              {d.correct}/{d.total}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${padL}, ${height - 12})`}>
        <rect x={0} y={-8} width={10} height={10} fill="#10b981" rx={2} />
        <text x={14} y={1} fill="#475569" fontSize={10}>Correct</text>
        <rect x={70} y={-8} width={10} height={10} fill="#fee2e2" rx={2} />
        <text x={84} y={1} fill="#475569" fontSize={10}>Incorrect</text>
      </g>
    </svg>
  );
}
