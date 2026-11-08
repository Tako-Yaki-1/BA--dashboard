import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Stepper from "../components/Stepper";
import FilterBar from "../components/FilterBar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ChartCard } from "../components/KpiCard";
import { peso, pesoCompact, num } from "../lib/format";
import { ACCENT } from "../lib/chartColors";
import { describeError } from "../lib/apiErrors";
import { getActualVsPredicted, getForecast, getModel, postPredict } from "../api/analytics";
import { getMetaFilters } from "../api/resources";
import type { AnalyticsFilters, AvpPoint, FiltersMeta, ForecastResponse, ModelResponse, PredictResponse } from "../types";

function weekLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-surface-100/70 px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      <span className="text-base font-bold text-ink-900">{value}</span>
    </div>
  );
}

export default function Predictive() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [vocab, setVocab] = useState<FiltersMeta | null>(null);
  const [model, setModel] = useState<ModelResponse | null>(null);
  const [avp, setAvp] = useState<AvpPoint[] | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // prediction form
  const [spend, setSpend] = useState("15000");
  const [discount, setDiscount] = useState("5");
  const [predicting, setPredicting] = useState(false);
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  useEffect(() => {
    getMetaFilters().then(setVocab).catch(() => setVocab(null));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getModel(filters),
      getActualVsPredicted(filters).then((r) => r.data),
      getForecast(filters),
    ])
      .then(([m, a, fc]) => {
        setModel(m);
        setAvp(a);
        setForecast(fc);
        setLoading(false);
      })
      .catch((err) => {
        setError(describeError(err).message);
        setLoading(false);
      });
  }, [filters]);

  useEffect(load, [load]);

  const submitPredict = (e: FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setPredictError(null);
    postPredict({ spend: Number(spend), discount_percent: Number(discount) })
      .then(setPredictResult)
      .catch((err) => setPredictError(describeError(err).message))
      .finally(() => setPredicting(false));
  };

  const bypassFilter = filters.date_from || filters.date_to || filters.channel;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink-900">Predictive Analytics</h1>
        <FilterBar filters={filters} vocab={vocab} onChange={setFilters} />
      </div>

      <Stepper current="Predictive" />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" aria-hidden="true" />
          <p className="text-sm text-ink-500">Fitting the model…</p>
        </div>
      ) : !model || model.message || model.coefficients === undefined ? (
        <EmptyState message={model?.message ?? "Not enough weeks in this filter to fit a model."} />
      ) : (
        <>
          {/* model summary card */}
          <section className="rounded-xl border border-accent-600/40 bg-accent-100/30 p-4" aria-label="Model summary">
            <h2 className="text-sm font-bold text-ink-900">
              Model: weekly revenue ~ marketing spend + discount %
              <span className="ml-2 rounded-md bg-accent-600 px-2 py-0.5 text-xs font-semibold text-white">from scratch, normal equations</span>
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="R²" value={model.r_squared?.toFixed(4) ?? "—"} />
              <Stat label="Adjusted R²" value={model.adjusted_r_squared?.toFixed(4) ?? "—"} />
              <Stat label="RMSE" value={peso(model.rmse ?? 0)} />
              <Stat label="Intercept" value={peso(model.intercept ?? 0)} />
              <Stat label="Spend coefficient" value={`+${model.coefficients.spend.toFixed(4)} ₱/₱`} />
              <Stat label="Discount coefficient" value={`${model.coefficients.discount_percent.toFixed(1)} ₱/pt`} />
            </div>
            <ul className="mt-3 flex flex-col gap-1 text-xs text-ink-700">
              <li>💡 {model.interpretation?.spend}</li>
              <li>💡 {model.interpretation?.discount_percent}</li>
              <li className="text-ink-500">ℹ️ {model.interpretation?.fit}</li>
            </ul>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* actual vs predicted */}
            <ChartCard title="Actual vs predicted weekly revenue" height={280} caption={bypassFilter ? "Fit on the filtered weeks." : "The model tracks the weeks it was fitted on."}>
              {!avp || avp.length === 0 ? (
                <EmptyState message="No weeks match this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={avp} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week_start" tickFormatter={weekLabel} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tickFormatter={pesoCompact} tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip labelFormatter={(label) => `Week of ${weekLabel(String(label))}`} formatter={(v) => (typeof v === "number" ? peso(v) : v)} />
                    <Legend />
                    <Line dataKey="actual" name="Actual" stroke="var(--color-ch-tiktok)" strokeWidth={2} dot={false} />
                    <Line dataKey="predicted" name="Predicted (model)" stroke={ACCENT} strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* forecast */}
            <ChartCard
              title="Next 4 weeks — simple trend projection"
              height={280}
              caption={`${forecast?.method ?? ""}: straight-line continuation of the weekly revenue trend, not a causal forecast.`}
            >
              {!forecast || forecast.data.length === 0 ? (
                <EmptyState message="Not enough weeks in this filter to project." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecast.data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week_start" tickFormatter={weekLabel} tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={pesoCompact} tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip labelFormatter={(label) => `Week of ${weekLabel(String(label))}`} formatter={(v) => (typeof v === "number" ? peso(v) : v)} />
                    <Bar dataKey="projected_revenue" name="Projected revenue" fill={ACCENT} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* prediction form */}
          <section className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label="Prediction form">
            <h2 className="text-sm font-bold text-ink-900">Try a week: what revenue would a spend + discount plan bring?</h2>
            <form onSubmit={submitPredict} className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink-700">Marketing spend (₱)</span>
                <input
                  type="number"
                  min="0"
                  value={spend}
                  onChange={(e) => setSpend(e.target.value)}
                  required
                  className="w-44 rounded-lg border border-ink-900/15 bg-surface-50 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink-700">Discount %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  required
                  className="w-32 rounded-lg border border-ink-900/15 bg-surface-50 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
                />
              </label>
              <button
                type="submit"
                disabled={predicting}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-50"
              >
                {predicting ? "Predicting…" : "Predict revenue"}
              </button>
            </form>
            {predictError && <p className="text-sm text-negative-600">{predictError}</p>}
            {predictResult?.predicted_weekly_revenue !== undefined && (
              <div className="flex flex-wrap items-center gap-3" aria-live="polite">
                <span className="text-2xl font-bold text-ink-900">{peso(predictResult.predicted_weekly_revenue)}</span>
                <span className="text-sm text-ink-500">projected weekly revenue for {peso(Number(spend))} spend at {num(Number(discount))}% discount</span>
              </div>
            )}
            {predictResult?.note && <p className="text-xs text-ink-500">ℹ️ {predictResult.note}</p>}
          </section>
        </>
      )}
    </div>
  );
}
