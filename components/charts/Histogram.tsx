// Score-distribution histogram. Bins values into N buckets across [0..max].

export function Histogram({
  values, max, bins = 10, height = 220, width = 600, label = "Score distribution", passMark,
}: {
  values: number[]; max: number; bins?: number;
  height?: number; width?: number; label?: string;
  passMark?: number;
}) {
  if (values.length === 0) return <div className="text-xs text-slate-400 italic">No submissions</div>;
  const counts = new Array(bins).fill(0);
  const binSize = Math.max(1, Math.ceil(max / bins));
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor(v / binSize));
    counts[idx]++;
  }
  const peak = Math.max(1, ...counts);
  const padL = 40, padR = 12, padT = 16, padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const slot = chartW / bins;
  const barW = slot - 2;

  const passX = passMark != null ? padL + (Math.min(passMark, max) / (binSize * bins)) * chartW : null;

  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label} · {values.length} submission{values.length !== 1 ? "s" : ""}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={label}>
        {/* Axes */}
        <line x1={padL} y1={padT + chartH} x2={width - padR} y2={padT + chartH} stroke="#cbd5e1" />
        {[0, 0.5, 1].map((t, i) => {
          const y = padT + chartH * (1 - t);
          return <line key={i} x1={padL} y1={y} x2={width - padR} y2={y} stroke="#e2e8f0" strokeDasharray={t === 0 ? "" : "2 3"} />;
        })}
        {/* Pass-mark line */}
        {passX != null && (
          <g>
            <line x1={passX} y1={padT - 4} x2={passX} y2={padT + chartH} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={passX + 4} y={padT + 6} fontSize={9} fill="#dc2626" fontWeight={600}>Pass: {passMark}</text>
          </g>
        )}
        {/* Bars */}
        {counts.map((c, i) => {
          const h = (c / peak) * chartH;
          const x = padL + i * slot + 1;
          const y = padT + chartH - h;
          const lower = i * binSize;
          const upper = i === bins - 1 ? max : (i + 1) * binSize - 1;
          const isPassing = passMark == null || lower >= passMark;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={2} fill={isPassing ? "#10b981" : "#94a3b8"} />
              {c > 0 && h > 14 && (
                <text x={x + barW / 2} y={y + 11} fontSize={9} fontWeight={600} fill="#fff" textAnchor="middle">{c}</text>
              )}
              <text x={x + barW / 2} y={padT + chartH + 14} fontSize={9} fill="#64748b" textAnchor="middle">
                {lower}{lower !== upper && `–${upper}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
