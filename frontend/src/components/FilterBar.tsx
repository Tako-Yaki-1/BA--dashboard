import type { AnalyticsFilters, FiltersMeta } from "../types";

interface FilterBarProps {
  filters: AnalyticsFilters;
  vocab: FiltersMeta | null;
  onChange: (next: AnalyticsFilters) => void;
}

/** Global analytics filters: date range + channel. Controlled by the page. */
export default function FilterBar({ filters, vocab, onChange }: FilterBarProps) {
  const active = filters.date_from || filters.date_to || filters.channel;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={filters.date_from ?? ""}
        onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
        aria-label="From date"
        className="rounded-lg border border-ink-900/15 bg-surface-50 px-2.5 py-2 text-sm focus:border-accent-600 focus:outline-none"
      />
      <span className="text-sm text-ink-500" aria-hidden="true">→</span>
      <input
        type="date"
        value={filters.date_to ?? ""}
        onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
        aria-label="To date"
        className="rounded-lg border border-ink-900/15 bg-surface-50 px-2.5 py-2 text-sm focus:border-accent-600 focus:outline-none"
      />
      <select
        value={filters.channel ?? ""}
        onChange={(e) => onChange({ ...filters, channel: e.target.value || undefined })}
        aria-label="Channel filter"
        className="max-w-64 rounded-lg border border-ink-900/15 bg-surface-50 px-2.5 py-2 text-sm focus:border-accent-600 focus:outline-none"
      >
        <option value="">All channels</option>
        {vocab?.channels.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {active && (
        <button
          onClick={() => onChange({})}
          className="text-sm font-medium text-accent-600 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
