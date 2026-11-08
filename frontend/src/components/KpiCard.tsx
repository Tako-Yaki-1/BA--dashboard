import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

/** One headline number; `highlight` marks the KPI the case study cares about. */
export default function KpiCard({ label, value, sub, highlight }: KpiCardProps) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 ${
        highlight ? "border-accent-600 bg-accent-100/50" : "border-ink-900/10 bg-surface-50"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      <span className="text-2xl font-bold text-ink-900" aria-live="polite">
        {value}
      </span>
      {sub && <span className="text-xs text-ink-500">{sub}</span>}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  height?: number;
  children: ReactNode;
  caption?: string;
}

/** Card wrapper for one chart or table, with an optional insight caption under it. */
export function ChartCard({ title, height = 260, children, caption }: ChartCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label={title}>
      <h2 className="text-sm font-bold text-ink-900">{title}</h2>
      <div style={{ height }}>
        {children}
      </div>
      {caption && (
        <p className="flex items-start gap-1.5 text-xs text-ink-500">
          <span aria-hidden="true">💡</span>
          {caption}
        </p>
      )}
    </section>
  );
}
