import type { ReactNode } from "react";
import type { PageMeta } from "../types";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right";
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  meta: PageMeta | null;
  sort: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
  onPage: (page: number) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  actions?: (row: T) => ReactNode;
}

/** Generic data table with sorting, pagination footer, and the required loading/empty/error states. */
export default function DataTable<T>({
  columns,
  rows,
  meta,
  sort,
  dir,
  onSort,
  onPage,
  loading,
  error,
  onRetry,
  actions,
}: DataTableProps<T>) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16" role="status" aria-live="polite">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" aria-hidden="true" />
        <p className="text-sm text-ink-500">Loading data…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState message="Try a different search or filter, or add a new record." />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sort === col.key ? (dir === "asc" ? "ascending" : "descending") : "none"}
                  className={`px-3 py-2.5 font-semibold ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 hover:text-ink-900"
                    >
                      {col.label}
                      <span className={sort === col.key ? "text-accent-600" : "text-ink-500/40"} aria-hidden="true">
                        {sort === col.key ? (dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {actions && <th scope="col" className="px-3 py-2.5 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String((row as { id: number }).id)} className="border-b border-ink-900/5 hover:bg-surface-100/60">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
                {actions && <td className="px-3 py-2.5 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-3 py-3 text-sm text-ink-500">
          <span>
            {meta.from}–{meta.to} of {meta.total}
          </span>
          <span className="flex items-center gap-2">
            <button
              onClick={() => onPage(meta.current_page - 1)}
              disabled={meta.current_page <= 1}
              className="rounded-md border border-ink-900/15 px-3 py-1.5 font-medium disabled:opacity-40 hover:border-accent-600 hover:text-accent-600"
            >
              Previous
            </button>
            <span aria-live="polite">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              onClick={() => onPage(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page}
              className="rounded-md border border-ink-900/15 px-3 py-1.5 font-medium disabled:opacity-40 hover:border-accent-600 hover:text-accent-600"
            >
              Next
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
