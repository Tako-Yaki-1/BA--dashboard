import { useCallback, useEffect, useState, type ReactNode } from "react";
import Stepper from "../components/Stepper";
import FilterBar from "../components/FilterBar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { peso, num } from "../lib/format";
import { describeError } from "../lib/apiErrors";
import { CHANNEL_COLORS } from "../lib/chartColors";
import { getCorrelation, getByChannel, getCustomersBreakdown, getStatistics, getByCategory } from "../api/analytics";
import { getMetaFilters } from "../api/resources";
import type {
  AnalyticsFilters,
  CategoryResponse,
  ChannelRow,
  CorrelationResponse,
  CustomersResponse,
  FiltersMeta,
  StatisticsResponse,
} from "../types";

const SERIES_LABELS: Record<string, string> = {
  weekly_revenue: "Weekly revenue",
  weekly_spend: "Weekly spend",
  discount_percent: "Discount %",
  order_value: "Order value",
};

const CORR_LABELS: Record<string, string> = {
  spend: "Spend",
  discount_percent: "Discount %",
  orders: "Orders",
  revenue: "Revenue",
};

function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return (
    <th scope="col" className={`px-3 py-2 font-semibold ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, right }: { children: ReactNode; right?: boolean }) {
  return <td className={`px-3 py-2 ${right ? "text-right" : "text-left"}`}>{children}</td>;
}

function Panel({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-900/10 bg-surface-50 p-4" aria-label={title}>
      <h2 className="mb-3 text-sm font-bold text-ink-900">{title}</h2>
      {children}
      {caption && (
        <p className="mt-3 text-xs text-ink-500">
          <span aria-hidden="true">💡 </span>
          {caption}
        </p>
      )}
    </section>
  );
}

export default function Descriptive() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [vocab, setVocab] = useState<FiltersMeta | null>(null);
  const [channels, setChannels] = useState<ChannelRow[] | null>(null);
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [corr, setCorr] = useState<CorrelationResponse | null>(null);
  const [customers, setCustomers] = useState<CustomersResponse | null>(null);
  const [category, setCategory] = useState<CategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetaFilters().then(setVocab).catch(() => setVocab(null));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getByChannel(filters).then((r) => r.data),
      getStatistics(filters),
      getCorrelation(filters),
      getCustomersBreakdown(filters),
      getByCategory(filters),
    ])
      .then(([ch, st, co, cu, ca]) => {
        setChannels(ch);
        setStats(st);
        setCorr(co);
        setCustomers(cu);
        setCategory(ca);
        setLoading(false);
      })
      .catch((err) => {
        setError(describeError(err).message);
        setLoading(false);
      });
  }, [filters]);

  useEffect(load, [load]);

  const best = channels ? [...channels].sort((a, b) => b.revenue_per_peso - a.revenue_per_peso)[0] : undefined;
  const topProduct = category?.top_products[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink-900">Descriptive Analytics</h1>
        <FilterBar filters={filters} vocab={vocab} onChange={setFilters} />
      </div>

      <Stepper current="Descriptive" />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" aria-hidden="true" />
          <p className="text-sm text-ink-500">Loading statistics…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* summary statistics */}
            <Panel
              title="Summary statistics"
              caption="Standard deviation uses the sample formula (n − 1 denominator)."
            >
              {!stats || stats.order_value.n === 0 ? (
                <EmptyState message="No data falls inside this filter." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-ink-900/10 text-ink-500">
                        <Th>Series</Th>
                        <Th right>n</Th>
                        <Th right>Mean</Th>
                        <Th right>Median</Th>
                        <Th right>Min</Th>
                        <Th right>Max</Th>
                        <Th right>Range</Th>
                        <Th right>SD</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SERIES_LABELS).map(([key, label]) => {
                        const s = stats[key as keyof StatisticsResponse];
                        return (
                          <tr key={key} className="border-b border-ink-900/5">
                            <Td>{label}</Td>
                            <Td right>{num(s.n)}</Td>
                            {(["mean", "median", "min", "max", "range", "sd"] as const).map((field) => (
                              <Td key={field} right>
                                {key === "order_value" || key === "weekly_revenue" || key === "weekly_spend"
                                  ? peso(s[field])
                                  : `${num(s[field])}%`}
                              </Td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            {/* channel comparison */}
            <Panel
              title="Channel comparison"
              caption={best ? `${best.channel} returned the most revenue per peso spent (₱${best.revenue_per_peso.toFixed(2)}).` : undefined}
            >
              {!channels || channels.length === 0 ? (
                <EmptyState message="No channels match this filter." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-ink-900/10 text-ink-500">
                        <Th>Channel</Th>
                        <Th right>Spend</Th>
                        <Th right>Revenue</Th>
                        <Th right>Orders</Th>
                        <Th right>₱ per ₱ spent</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...channels]
                        .sort((a, b) => b.revenue_per_peso - a.revenue_per_peso)
                        .map((row) => (
                          <tr key={row.channel} className="border-b border-ink-900/5">
                            <Td>
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: CHANNEL_COLORS[row.channel] }}
                                  aria-hidden="true"
                                />
                                {row.channel}
                              </span>
                            </Td>
                            <Td right>{peso(row.spend)}</Td>
                            <Td right>{peso(row.revenue)}</Td>
                            <Td right>{num(row.orders)}</Td>
                            <Td right>
                              <strong>₱{row.revenue_per_peso.toFixed(2)}</strong>
                            </Td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            {/* customer breakdown */}
            <Panel title="Customer breakdown">
              {!customers || customers.by_type.length === 0 ? (
                <EmptyState message="No customer purchases match this filter." />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["By customer type", customers.by_type],
                      ["By loyalty tier", customers.by_tier],
                    ] as const
                  ).map(([title, rows]) => (
                    <div key={title}>
                      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-ink-900/10 text-ink-500">
                            <Th>Segment</Th>
                            <Th right>Customers</Th>
                            <Th right>Revenue</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.segment} className="border-b border-ink-900/5">
                              <Td>{row.segment}</Td>
                              <Td right>{num(row.customers)}</Td>
                              <Td right>{peso(row.revenue)}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* correlation matrix */}
            <Panel title="Correlation matrix (weekly series)" caption="Closer to +1 means the two move together; values near 0 mean no linear link. Numbers are printed so color is never the only signal.">
              {!corr || corr.variables.length === 0 ? (
                <EmptyState message="Not enough weeks in this filter to compute correlations." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-ink-900/10 text-ink-500">
                        <Th></Th>
                        {corr.variables.map((v) => (
                          <Th key={v} right={false}>
                            {CORR_LABELS[v] ?? v}
                          </Th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {corr.matrix.map((row, i) => (
                        <tr key={corr.variables[i]} className="border-b border-ink-900/5">
                          <Td>{CORR_LABELS[corr.variables[i]] ?? corr.variables[i]}</Td>
                          {row.map((value, j) => {
                            const alpha = Math.min(0.65, Math.abs(value));
                            return (
                              <td
                                key={j}
                                className="px-3 py-2 text-right font-semibold"
                                style={{
                                  backgroundColor:
                                    value === 1
                                      ? "transparent"
                                      : value >= 0
                                        ? `rgba(109, 40, 217, ${alpha})`
                                        : `rgba(192, 86, 48, ${alpha})`,
                                  color: Math.abs(value) > 0.45 && value !== 1 ? "#fff" : undefined,
                                }}
                              >
                                {value === 1 ? "—" : value.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>

          {/* top products */}
          <Panel title="Top 10 products by revenue" caption={topProduct ? `${topProduct.name} leads at ${peso(topProduct.revenue)} across ${num(topProduct.units)} units.` : undefined}>
            {!category || category.top_products.length === 0 ? (
              <EmptyState message="No product sales match this filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-500">
                      <Th>#</Th>
                      <Th>Product</Th>
                      <Th>Category</Th>
                      <Th right>Units</Th>
                      <Th right>Revenue</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.top_products.map((row, i) => (
                      <tr key={row.id} className="border-b border-ink-900/5">
                        <Td>{i + 1}</Td>
                        <Td>{row.name}</Td>
                        <Td>{row.category}</Td>
                        <Td right>{num(row.units)}</Td>
                        <Td right>{peso(row.revenue)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
