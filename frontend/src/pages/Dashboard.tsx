import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import KpiCard, { ChartCard } from "../components/KpiCard";
import FilterBar from "../components/FilterBar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { peso, pesoCompact, num } from "../lib/format";
import { CHANNEL_COLORS, TIER_COLORS, ACCENT, CHART_FALLBACK } from "../lib/chartColors";
import { describeError } from "../lib/apiErrors";
import {
  getByCategory,
  getByChannel,
  getCorrelation,
  getCustomersBreakdown,
  getStatistics,
  getSummary,
  getTrend,
} from "../api/analytics";
import { getMetaFilters } from "../api/resources";
import type {
  AnalyticsFilters,
  CategoryResponse,
  ChannelRow,
  CorrelationResponse,
  CustomersResponse,
  FiltersMeta,
  StatisticsResponse,
  SummaryKpis,
  TrendPoint,
} from "../types";

/** "2025-08-04" -> "Aug 4" for chart axes. */
function weekLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function weekTick(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (d.getMonth() === 0 || d.getDate() <= 7) return d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" });
  return "";
}

interface DashboardData {
  summary: SummaryKpis;
  trend: TrendPoint[];
  channels: ChannelRow[];
  categories: CategoryResponse;
  customers: CustomersResponse;
  stats: StatisticsResponse;
  corr: CorrelationResponse;
}

export default function Dashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [vocab, setVocab] = useState<FiltersMeta | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetaFilters().then(setVocab).catch(() => setVocab(null));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getSummary(filters),
      getTrend(filters).then((r) => r.data),
      getByChannel(filters).then((r) => r.data),
      getByCategory(filters),
      getCustomersBreakdown(filters),
      getStatistics(filters),
      getCorrelation(filters),
    ])
      .then(([summary, trend, channels, categories, customers, stats, corr]) => {
        setData({ summary, trend, channels, categories, customers, stats, corr });
        setLoading(false);
      })
      .catch((err) => {
        setError(describeError(err).message);
        setLoading(false);
      });
  }, [filters]);

  useEffect(load, [load]);

  const bestChannel = data
    ? [...data.channels].sort((a, b) => b.revenue_per_peso - a.revenue_per_peso)[0]
    : undefined;
  const bestCategory = data
    ? [...data.categories.data].sort((a, b) => b.revenue - a.revenue)[0]
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink-900">Dashboard</h1>
        <FilterBar filters={filters} vocab={vocab} onChange={setFilters} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading || !data ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" aria-hidden="true" />
          <p className="text-sm text-ink-500">Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <KpiCard label="Revenue" value={peso(data.summary.total_revenue)} sub="total product sales" />
            <KpiCard label="Orders" value={num(data.summary.orders)} sub="sales in range" />
            <KpiCard label="Avg order value" value={peso(data.summary.average_order_value)} />
            <KpiCard label="Marketing spend" value={peso(data.summary.total_spend)} sub="campaigns in range" />
            <KpiCard
              label="Revenue per ₱1 spent"
              value={`₱${data.summary.revenue_per_peso.toFixed(2)}`}
              sub="overall marketing ROI"
              highlight
            />
          </div>

          {/* weekly trend */}
          <ChartCard
            title="Weekly revenue, orders and marketing spend"
            height={300}
            caption={
              bestChannel
                ? `${bestChannel.channel} leads the data at ₱${bestChannel.revenue_per_peso.toFixed(2)} revenue per peso spent.`
                : undefined
            }
          >
            {data.trend.length === 0 ? (
              <EmptyState message="No sales fall inside this filter. Try a wider date range or All channels." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.trend} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week_start" tickFormatter={weekTick} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis yAxisId="money" tickFormatter={pesoCompact} tick={{ fontSize: 11 }} axisLine={false} />
                  <YAxis yAxisId="qty" orientation="right" tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip
                    labelFormatter={(label) => `Week of ${weekLabel(String(label))}`}
                    formatter={(value, name) =>
                      name === "Orders"
                        ? typeof value === "number" ? [num(value), name] : [value, name]
                        : typeof value === "number" ? [peso(value), name] : [value, name]
                    }
                  />
                  <Legend />
                  <Bar yAxisId="qty" dataKey="orders" name="Orders" fill="var(--color-accent-100)" barSize={10} />
                  <Line yAxisId="money" dataKey="revenue" name="Revenue" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                  <Line yAxisId="money" dataKey="spend" name="Marketing spend" stroke="var(--color-ink-500)" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* revenue by channel */}
            <ChartCard title="Revenue by marketing channel" caption={bestChannel ? `${bestChannel.channel} returned the most revenue per peso spent.` : undefined}>
              {data.channels.length === 0 ? (
                <EmptyState message="No campaign channels match this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.channels} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="channel" tickFormatter={(c: string) => c.split(" ")[0]} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={pesoCompact} tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip formatter={(value) => (typeof value === "number" ? peso(value) : value)} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {data.channels.map((row) => (
                        <Cell key={row.channel} fill={CHANNEL_COLORS[row.channel] ?? CHART_FALLBACK} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* revenue by category */}
            <ChartCard title="Revenue by product category" caption={bestCategory ? `${bestCategory.category} is the biggest category at ${peso(bestCategory.revenue)}.` : undefined}>
              {data.categories.data.length === 0 ? (
                <EmptyState message="No product sales fall inside this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categories.data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={pesoCompact} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={96} />
                    <Tooltip formatter={(value) => (typeof value === "number" ? peso(value) : value)} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} fill={ACCENT} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* spend vs revenue scatter */}
            <ChartCard title="Marketing spend vs weekly revenue" caption="Each dot is one campaign week; the upward scatter is what the predictive model formalizes.">
              {data.trend.length === 0 ? (
                <EmptyState message="No weeks match this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" dataKey="spend" tickFormatter={pesoCompact} tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="revenue" tickFormatter={pesoCompact} tick={{ fontSize: 11 }} />
                    <ZAxis type="number" dataKey="orders" range={[40, 200]} />
                    <Tooltip
                      formatter={(value, name) => (typeof value === "number" ? (name === "Orders" ? num(value) : peso(value)) : value)}
                      labelFormatter={() => ""}
                    />
                    <Scatter data={data.trend} name="Campaign week" fill={ACCENT} fillOpacity={0.65} />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* customers by loyalty tier */}
            <ChartCard title="Customers by loyalty tier" caption={`${num(firstCustomerTotal(data))} people bought within the selected range.`}>
              {data.customers.by_tier.length === 0 ? (
                <EmptyState message="No customer purchases match this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.customers.by_tier}
                      dataKey="customers"
                      nameKey="segment"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={2}
                    >
                      {data.customers.by_tier.map((row) => (
                        <Cell key={row.segment} fill={TIER_COLORS[row.segment] ?? CHART_FALLBACK} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => (typeof value === "number" ? num(value) : value)} />
                    <Legend />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-ink-900 font-bold text-lg">
                      {num(firstCustomerTotal(data))}
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function firstCustomerTotal(data: DashboardData): number {
  return data.customers.by_tier.reduce((sum, row) => sum + row.customers, 0);
}
