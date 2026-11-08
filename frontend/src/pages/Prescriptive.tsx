import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Stepper from "../components/Stepper";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ChartCard } from "../components/KpiCard";
import { num, peso, pesoCompact } from "../lib/format";
import { CHANNEL_COLORS } from "../lib/chartColors";
import { describeError } from "../lib/apiErrors";
import {
  getChannelRoi,
  getRecommendations,
  postAllocate,
  postWhatIf,
} from "../api/analytics";
import type {
  AllocateResponse,
  ChannelRoiResponse,
  Recommendation,
  WhatIfResponse,
} from "../types";

export default function Prescriptive() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roi, setRoi] = useState<ChannelRoiResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

  // allocator state — re-allocated live as the budget changes
  const [budget, setBudget] = useState(100000);
  const [allocation, setAllocation] = useState<AllocateResponse | null>(null);
  const [allocError, setAllocError] = useState<string | null>(null);

  // what-if state — projected live as the slider moves
  const [pct, setPct] = useState(20);
  const [whatIf, setWhatIf] = useState<WhatIfResponse | null>(null);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getChannelRoi(), getRecommendations()])
      .then(([r, rec]) => {
        setRoi(r);
        setRecommendations(rec.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(describeError(err).message);
        setLoading(false);
      });
  }, []);

  useEffect(load, [load]);

  // live re-allocation (debounced so dragging the budget doesn't spam the API)
  const budgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (budgetTimer.current) clearTimeout(budgetTimer.current);
    setAllocError(null);
    budgetTimer.current = setTimeout(() => {
      postAllocate({ total_budget: budget })
        .then(setAllocation)
        .catch((err) => setAllocError(describeError(err).message));
    }, 350);
    return () => {
      if (budgetTimer.current) clearTimeout(budgetTimer.current);
    };
  }, [budget]);

  // live what-if projection
  const pctTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (pctTimer.current) clearTimeout(pctTimer.current);
    setWhatIfError(null);
    pctTimer.current = setTimeout(() => {
      postWhatIf({ pct_change: pct })
        .then(setWhatIf)
        .catch((err) => setWhatIfError(describeError(err).message));
    }, 350);
    return () => {
      if (pctTimer.current) clearTimeout(pctTimer.current);
    };
  }, [pct]);

  const allocDelta =
    allocation && whatIf
      ? whatIf.projected_weekly_revenue - whatIf.baseline_weekly_revenue
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink-900">Prescriptive Analytics</h1>
      </div>

      <Stepper current="Prescriptive" />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" aria-hidden="true" />
          <p className="text-sm text-ink-500">Ranking channels…</p>
        </div>
      ) : (
        <>
          {/* channel ROI ranking */}
          <section className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label="Channel ROI ranking">
            <h2 className="text-sm font-bold text-ink-900">Channel ROI ranking</h2>
            <p className="text-xs text-ink-500">{roi?.method}</p>
            <ol className="flex flex-col gap-2">
              {roi?.data.map((row, i) => (
                <li key={row.channel} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900/10 text-xs font-bold text-ink-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <span className="truncate text-sm font-semibold text-ink-900">{row.channel}</span>
                      <span className="text-sm font-bold text-accent-700">{num(row.roi)} ₱ per ₱1</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: CHANNEL_COLORS[row.channel],
                          width: `${(row.roi / (roi.data[0].roi || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {pesoCompact(row.revenue)} revenue on {pesoCompact(row.spend)} spend
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* budget allocator */}
          <section className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label="Budget allocator">
            <h2 className="text-sm font-bold text-ink-900">Budget allocator</h2>
            <p className="text-xs text-ink-500">{allocation?.rule}</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-ink-700">Monthly budget (₱)</span>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))}
                    className="w-44 rounded-lg border border-ink-900/15 bg-surface-50 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  />
                </label>
                <div className="rounded-lg bg-accent-100/60 px-3 py-2" aria-live="polite">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Expected uplift vs even split</p>
                  <p className="text-lg font-bold text-accent-700">
                    +{num(allocation?.uplift_percent ?? 0)}%
                  </p>
                </div>
              </div>
              {allocError ? (
                <ErrorState message={allocError} onRetry={() => setBudget((b) => b)} />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={allocation?.allocations} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="channel"
                        tick={{ fontSize: 9 }}
                        tickFormatter={(c: string) => c.split(" ")[0]}
                        interval={0}
                      />
                      <YAxis tickFormatter={pesoCompact} tick={{ fontSize: 11 }} axisLine={false} />
                      <Tooltip formatter={(v) => (typeof v === "number" ? peso(v) : "")} />
                      <Bar dataKey="allocated_pesos" name="allocated_pesos" radius={[4, 4, 0, 0]}>
                        {(allocation?.allocations ?? []).map((a) => (
                          <Cell key={a.channel} fill={CHANNEL_COLORS[a.channel]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-ink-500">
                        <th className="font-semibold">Channel</th>
                        <th className="font-semibold">Share</th>
                        <th className="font-semibold text-right">Allocated</th>
                        <th className="font-semibold text-right">Expected revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allocation?.allocations ?? []).map((a) => (
                        <tr key={a.channel} className="border-t border-ink-900/5">
                          <td className="py-1 text-ink-900">
                            <span
                              className="mr-2 inline-block h-2 w-2 rounded-full"
                              style={{ background: CHANNEL_COLORS[a.channel] }}
                              aria-hidden="true"
                            />
                            {a.channel}
                          </td>
                          <td className="py-1">{a.share_percent}%</td>
                          <td className="py-1 text-right">{peso(a.allocated_pesos)}</td>
                          <td className="py-1 text-right font-semibold">{peso(a.expected_revenue)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-ink-900/10 font-bold text-ink-900">
                        <td className="py-1">Total</td>
                        <td className="py-1">100%</td>
                        <td className="py-1 text-right">{peso(allocation?.total_budget ?? 0)}</td>
                        <td className="py-1 text-right">{peso(allocation?.expected_revenue ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </section>

          {/* what-if simulator */}
          <ChartCard
            title="What-if: change the budget"
            height={260}
            caption={whatIf?.note}
          >
            <div className="flex h-full flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex flex-1 flex-col gap-1 text-sm" style={{ minWidth: 220 }}>
                  <span className="font-medium text-ink-700">
                    Budget change: <strong className="text-accent-700">{pct > 0 ? "+" : ""}{pct}%</strong>
                  </span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    value={pct}
                    onChange={(e) => setPct(Number(e.target.value))}
                    className="accent-[var(--color-accent-600)]"
                    aria-label="Budget change percent"
                  />
                </label>
                <input
                  type="number"
                  min="-100"
                  max="500"
                  value={pct}
                  onChange={(e) => setPct(Math.max(-100, Math.min(500, Number(e.target.value))))}
                  className="w-24 rounded-lg border border-ink-900/15 bg-surface-50 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  aria-label="Budget change percent, exact"
                />
              </div>
              {whatIfError ? (
                <ErrorState message={whatIfError} onRetry={() => setPct((p) => p)} />
              ) : whatIf ? (
                <div className="flex flex-wrap gap-3" aria-live="polite">
                  <div className="rounded-lg bg-surface-100/70 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Baseline weekly budget</p>
                    <p className="text-lg font-bold text-ink-900">{peso(whatIf.baseline_weekly_budget)}</p>
                  </div>
                  <div className="rounded-lg bg-surface-100/70 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">New weekly budget</p>
                    <p className="text-lg font-bold text-ink-900">{peso(whatIf.new_weekly_budget)}</p>
                  </div>
                  <div className="rounded-lg bg-surface-100/70 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Baseline weekly revenue</p>
                    <p className="text-lg font-bold text-ink-900">{peso(whatIf.baseline_weekly_revenue)}</p>
                  </div>
                  <div className="rounded-lg bg-accent-100/60 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Projected weekly revenue</p>
                    <p className={`text-lg font-bold ${allocDelta !== null && allocDelta < 0 ? "text-negative-600" : "text-accent-700"}`}>
                      {peso(whatIf.projected_weekly_revenue)}
                      {allocDelta !== null && (
                        <span className="ml-1 text-sm">
                          ({allocDelta >= 0 ? "+" : ""}{pesoCompact(allocDelta)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState message="Move the slider to project a budget." />
              )}
            </div>
          </ChartCard>

          {/* recommendation cards */}
          <section className="flex flex-col gap-3" aria-label="Recommendations">
            <h2 className="text-sm font-bold text-ink-900">Recommendations</h2>
            <ol className="flex flex-col gap-2">
              {recommendations?.map((rec) => (
                <li
                  key={rec.rank}
                  className="flex items-start gap-3 rounded-xl border border-ink-900/10 bg-surface-50 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-600 text-sm font-bold text-white" aria-hidden="true">
                    {rec.rank}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900">{rec.title}</h3>
                    <p className="mt-0.5 text-sm text-ink-700">{rec.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
