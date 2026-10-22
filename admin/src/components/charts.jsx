// Minimal SVG charts (no chart library).
import { useEffect, useRef, useState } from 'react';

function useWidth(fallback = 640) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// series: [{name, values, color, dashed}]
export function LineChart({ labels, series, height = 240, threshold, unit = 'ms' }) {
  const [ref, w] = useWidth();
  const h = height;
  const pad = { l: 48, r: 16, t: 16, b: 28 };
  // Round, even steps with the top tick above the maximum (never on it).
  const top = Math.max(...series.flatMap((s) => s.values), threshold ? threshold.value : 0);
  const step = [100, 200, 250, 500, 1000, 2000, 5000].find((st) => top / st <= 5) || 10000;
  const max = (Math.floor(top / step) + 1) * step;
  const x = (i) => pad.l + (i * (w - pad.l - pad.r)) / (labels.length - 1);
  const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const grid = Array.from({ length: max / step + 1 }, (_, g) => g * step);

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`${series.map((s) => s.name).join(', ')} over time`}>
        {grid.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} className="grid" />
            <text x={pad.l - 8} y={y(v) + 4} className="axis" textAnchor="end">{Math.round(v)}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % 3 === 0 ? <text key={l} x={x(i)} y={h - 8} className="axis" textAnchor="middle">{l}</text> : null))}
        {threshold && (
          <>
            <line x1={pad.l} x2={w - pad.r} y1={y(threshold.value)} y2={y(threshold.value)} className="threshold" />
            <text x={w - pad.r} y={y(threshold.value) - 6} className="threshold-label" textAnchor="end">{threshold.label}</text>
          </>
        )}
        {series.map((s) => {
          const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
                    return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" />
            </g>
          );
        })}
        {labels.map((l, i) => (
          <rect key={`hit-${l}`} x={x(i) - 8} y={pad.t} width="16" height={h - pad.t - pad.b} fill="transparent">
            <title>{`${l}\n${series.map((s) => `${s.name}: ${s.values[i]} ${unit}`).join('\n')}`}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

// items: [{label, value(0..1), color}]
export function HBars({ items, format = (v) => Math.round(v * 100) + '%' }) {
  return (
    <ul className="hbars">
      {items.map((it) => (
        <li key={it.label}>
          <span className="hbars__label">{it.label}</span>
          <span className="hbars__track"><span className="hbars__fill" style={{ width: `${Math.max(2, it.value * 100)}%`, background: it.color || 'var(--accent)' }} /></span>
          <span className="hbars__value">{format(it.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Ring({ value, label = '', color = 'var(--accent)', target }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label={`${label} ${Math.round(value * 100)}%`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--track)" strokeWidth="12" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${(value * c).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 60 60)" />
      {target ? <line x1="60" y1="8" x2="60" y2="20" stroke="var(--ink)" strokeWidth="2" transform={`rotate(${target * 360} 60 60)`} /> : null}
      <text x="60" y="64" textAnchor="middle" className="ring-num">{Math.round(value * 100)}%</text>
    </svg>
  );
}

// parts: [{label, ms, color}]
export function Stack({ parts }) {
  const shown = parts.filter((p) => p.ms > 0);
  return (
    <div className="stack" role="img" aria-label={shown.map((p) => `${p.label} ${p.ms} ms`).join(', ')}>
      {shown.map((p) => <span key={p.label} style={{ flex: p.ms, background: p.color }} title={`${p.label}: ${p.ms} ms`} />)}
    </div>
  );
}
