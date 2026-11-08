import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import DataTable from "../components/DataTable";
import { describeError } from "../lib/apiErrors";
import { num, peso } from "../lib/format";
import {
  createCampaign,
  createCustomer,
  createProduct,
  deleteCampaign,
  deleteCustomer,
  deleteProduct,
  getCampaigns,
  getCustomers,
  getMetaFilters,
  getProducts,
  getSales,
  getTransactions,
  updateCampaign,
  updateCustomer,
  updateProduct,
} from "../api/resources";
import type {
  Campaign,
  Customer,
  FiltersMeta,
  ListParams,
  PageMeta,
  Paginated,
  Product,
  Sale,
  Tab,
  Transaction,
} from "../types";

type Row = (Customer | Product | Campaign | Sale | Transaction) & { id: number };

const TAB_LABELS: Record<Tab, string> = {
  customers: "Customers",
  products: "Products",
  campaigns: "Marketing Campaigns",
  sales: "Sales",
  transactions: "Transactions",
};

const CRUD_TABS: Tab[] = ["customers", "products", "campaigns"];

const TAB_DESCRIPTION: Record<Tab, string> = {
  customers: "60 people the shop sells to, with loyalty tier and city.",
  products: "The catalog: kits, switches, keycaps, deskmats, mod parts.",
  campaigns: "One marketing campaign per week for a full year.",
  sales: "300 order headers, linked to a customer and a campaign week.",
  transactions: "Line items behind every sale order.",
};

/* ---------- field + column configuration ---------- */

type FieldType = "text" | "number" | "date" | "select";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  step?: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  "Facebook and Instagram Ads": "bg-ch-facebook",
  "TikTok Creator Collabs": "bg-ch-tiktok",
  "Discord and Gaming Community Sponsorships": "bg-ch-discord",
  "Campus Pop-up Booths": "bg-ch-popup",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Keyboard Kits": "bg-cat-kit",
  Switches: "bg-cat-switch",
  "Keycap Sets": "bg-cat-keycap",
  "Deskmats and Accessories": "bg-cat-deskmat",
  "Mod Parts and Tools": "bg-cat-mod",
};

function Chip({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ---------- generic list fetch ---------- */

const FETCHERS: Record<Tab, (p: ListParams) => Promise<Paginated<Row>>> = {
  customers: getCustomers as (p: ListParams) => Promise<Paginated<Row>>,
  products: getProducts as (p: ListParams) => Promise<Paginated<Row>>,
  campaigns: getCampaigns as (p: ListParams) => Promise<Paginated<Row>>,
  sales: getSales as (p: ListParams) => Promise<Paginated<Row>>,
  transactions: getTransactions as (p: ListParams) => Promise<Paginated<Row>>,
};

interface ListState {
  loading: boolean;
  error: string | null;
  rows: Row[];
  meta: PageMeta | null;
}

/* ---------- record form ---------- */

function RecordForm({
  fields,
  initial,
  submitting,
  fieldErrors,
  onCancel,
  onSubmit,
}: {
  fields: FieldDef[];
  initial: Record<string, string>;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState(initial);
  useEffect(() => setValues(initial), [initial]);

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="flex flex-col gap-3"
    >
      {fields.map((f) => (
        <label key={f.key} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-700">
            {f.label}
            {f.required && <span className="text-negative-600"> *</span>}
          </span>
          {f.type === "select" ? (
            <select
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              required={f.required}
              className="rounded-lg border border-ink-900/15 bg-surface-50 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
            >
              <option value="" disabled>
                Choose…
              </option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type}
              step={f.step}
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              required={f.required}
              min={f.type === "number" ? "0" : undefined}
              className="rounded-lg border border-ink-900/15 bg-surface-50 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          )}
          {fieldErrors[f.key] && <span className="text-xs text-negative-600">{fieldErrors[f.key]}</span>}
        </label>
      ))}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink-900/15 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-ink-900/30"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

/* ---------- the page ---------- */

export default function DataManager() {
  const [tab, setTab] = useState<Tab>("customers");
  const [vocab, setVocab] = useState<FiltersMeta | null>(null);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("id");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ channel?: string; category?: string; date_from?: string; date_to?: string }>({});

  const [list, setList] = useState<ListState>({ loading: true, error: null, rows: [], meta: null });

  const [editing, setEditing] = useState<{ mode: "create" | "edit"; row?: Row } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMetaFilters().then(setVocab).catch(() => setVocab(null));
  }, []);

  const load = useCallback(() => {
    setList((s) => ({ ...s, loading: true, error: null }));
    const params: ListParams = { page, q, sort, dir, ...filters };
    FETCHERS[tab](params)
      .then((res) => setList({ loading: false, error: null, rows: res.data, meta: res.meta }))
      .catch((err) => setList({ loading: false, error: describeError(err).message, rows: [], meta: null }));
  }, [tab, page, q, sort, dir, filters]);

  useEffect(() => setPage(1), [tab, q, sort, dir, filters]);
  useEffect(load, [load]);

  const onSort = (key: string) => {
    if (sort === key) {
      setDir(dir === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setDir("asc");
    }
  };

  const buildFields = (): FieldDef[] => {
    switch (tab) {
      case "customers":
        return [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "customer_type", label: "Customer type", type: "select", options: vocab?.customer_types, required: true },
          { key: "loyalty_tier", label: "Loyalty tier", type: "select", options: vocab?.loyalty_tiers, required: true },
          { key: "city", label: "City", type: "text", required: true },
          { key: "joined_date", label: "Joined date", type: "date", required: true },
        ];
      case "products":
        return [
          { key: "name", label: "Product name", type: "text", required: true },
          { key: "category", label: "Category", type: "select", options: vocab?.product_categories, required: true },
          { key: "price", label: "Price (₱)", type: "number", step: "0.01", required: true },
          { key: "cost", label: "Cost (₱)", type: "number", step: "0.01", required: true },
        ];
      case "campaigns":
        return [
          { key: "week_start", label: "Week start (unique per week)", type: "date", required: true },
          { key: "channel", label: "Channel", type: "select", options: vocab?.channels, required: true },
          { key: "spend", label: "Spend (₱)", type: "number", step: "0.01", required: true },
          { key: "discount_percent", label: "Discount %", type: "number", step: "0.5", required: true },
          { key: "reach", label: "Reach (people)", type: "number", step: "1", required: true },
        ];
      default:
        return [];
    }
  };

  const saveRecord = async (values: Record<string, string>) => {
    setSubmitting(true);
    setFormErrors({});
    const row = editing?.row;
    const isEdit = editing?.mode === "edit" && row !== undefined;
    try {
      if (tab === "customers") {
        if (isEdit && row) await updateCustomer(row.id, values);
        else await createCustomer(values as unknown as Omit<Customer, "id">);
      } else if (tab === "products") {
        if (isEdit && row) await updateProduct(row.id, values);
        else await createProduct(values as unknown as Omit<Product, "id">);
      } else if (tab === "campaigns") {
        if (isEdit && row) await updateCampaign(row.id, values);
        else await createCampaign(values as unknown as Omit<Campaign, "id">);
      }
      setEditing(null);
      load();
    } catch (err) {
      const { fieldErrors, message } = describeError(err);
      setFormErrors(fieldErrors ?? {});
      if (!fieldErrors) setFormErrors({ _form: message });
    } finally {
      setSubmitting(false);
    }
  };

  const removeRecord = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      if (tab === "customers") await deleteCustomer(deleting.id);
      else if (tab === "products") await deleteProduct(deleting.id);
      else if (tab === "campaigns") await deleteCampaign(deleting.id);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleting(null);
      setList((s) => ({ ...s, error: describeError(err).message }));
    } finally {
      setSubmitting(false);
    }
  };

  /* columns per tab */
  const rowLabel = (row: Row): string => {
    const maybeName = (row as unknown as Record<string, unknown>).name;
    return typeof maybeName === "string" && maybeName !== "" ? maybeName : `#${row.id}`;
  };

  const actionButtons = (row: Row): ReactNode =>
    CRUD_TABS.includes(tab) ? (
      <span className="flex justify-end gap-1">
        <button
          onClick={() => setEditing({ mode: "edit", row })}
          aria-label={`Edit ${rowLabel(row)}`}
          className="rounded-md p-1.5 text-ink-500 hover:bg-accent-100 hover:text-accent-600"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => setDeleting(row)}
          aria-label={`Delete ${rowLabel(row)}`}
          className="rounded-md p-1.5 text-ink-500 hover:bg-accent-100 hover:text-negative-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
    ) : null;

  const columns =
    tab === "customers"
      ? [
          { key: "name", label: "Name", sortable: true },
          { key: "customer_type", label: "Type", sortable: true },
          { key: "loyalty_tier", label: "Tier", sortable: true },
          { key: "city", label: "City", sortable: true },
          { key: "joined_date", label: "Joined", sortable: true, render: (r: Row) => fmtDate((r as Customer).joined_date) },
        ]
      : tab === "products"
        ? [
            { key: "name", label: "Product", sortable: true },
            {
              key: "category",
              label: "Category",
              sortable: true,
              render: (r: Row) => <Chip label={(r as Product).category} colorClass={CATEGORY_COLORS[(r as Product).category] ?? "bg-ink-500"} />,
            },
            { key: "price", label: "Price", sortable: true, align: "right" as const, render: (r: Row) => peso((r as Product).price) },
            { key: "cost", label: "Cost", sortable: true, align: "right" as const, render: (r: Row) => peso((r as Product).cost) },
          ]
      : tab === "campaigns"
        ? [
            { key: "week_start", label: "Week start", sortable: true, render: (r: Row) => fmtDate((r as Campaign).week_start) },
            {
              key: "channel",
              label: "Channel",
              sortable: true,
              render: (r: Row) => <Chip label={(r as Campaign).channel} colorClass={CHANNEL_COLORS[(r as Campaign).channel] ?? "bg-ink-500"} />,
            },
            { key: "spend", label: "Spend", sortable: true, align: "right" as const, render: (r: Row) => peso((r as Campaign).spend) },
            { key: "discount_percent", label: "Discount", sortable: true, align: "right" as const, render: (r: Row) => `${num((r as Campaign).discount_percent)}%` },
            { key: "reach", label: "Reach", sortable: true, align: "right" as const, render: (r: Row) => num((r as Campaign).reach) },
          ]
      : tab === "sales"
        ? [
            { key: "order_date", label: "Order date", sortable: true, render: (r: Row) => fmtDate((r as Sale).order_date) },
            { key: "customer_name", label: "Customer", render: (r: Row) => (r as Sale).customer_name ?? "—" },
            {
              key: "channel",
              label: "Channel",
              render: (r: Row) => {
                const ch = (r as Sale).channel;
                return ch ? <Chip label={ch} colorClass={CHANNEL_COLORS[ch] ?? "bg-ink-500"} /> : "—";
              },
            },
            { key: "payment_method", label: "Payment", render: (r: Row) => (r as Sale).payment_method },
            { key: "total_amount", label: "Total", sortable: true, align: "right" as const, render: (r: Row) => peso((r as Sale).total_amount) },
          ]
        : [
            { key: "order_date", label: "Order date", render: (r: Row) => fmtDate((r as Transaction).order_date ?? null) },
            { key: "product_name", label: "Product", render: (r: Row) => (r as Transaction).product_name ?? "—" },
            {
              key: "product_category",
              label: "Category",
              render: (r: Row) => {
                const cat = (r as Transaction).product_category;
                return cat ? <Chip label={cat} colorClass={CATEGORY_COLORS[cat] ?? "bg-ink-500"} /> : "—";
              },
            },
            { key: "quantity", label: "Qty", sortable: true, align: "right" as const, render: (r: Row) => num((r as Transaction).quantity) },
            { key: "unit_price", label: "Unit price", sortable: true, align: "right" as const, render: (r: Row) => peso((r as Transaction).unit_price) },
            { key: "line_total", label: "Line total", sortable: true, align: "right" as const, render: (r: Row) => peso((r as Transaction).line_total) },
          ];

  const showRangeFilters = tab === "sales" || tab === "transactions";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-900/10 bg-surface-50 p-1.5" role="tablist" aria-label="Data tables">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setFilters({});
              setQ("");
              setSort("id");
              setDir("asc");
            }}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              tab === t ? "bg-accent-600 text-white" : "text-ink-500 hover:bg-surface-100 hover:text-ink-900"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <p className="text-sm text-ink-500">{TAB_DESCRIPTION[tab]}</p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "transactions" ? "Search product name…" : "Search name…"}
            aria-label="Search"
            className="w-56 rounded-lg border border-ink-900/15 bg-surface-50 py-2 pl-8 pr-3 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>

        {showRangeFilters && (
          <>
            <select
              value={filters.channel ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value || undefined }))}
              aria-label="Channel filter"
              className="rounded-lg border border-ink-900/15 bg-surface-50 px-2.5 py-2 text-sm focus:border-accent-600 focus:outline-none"
            >
              <option value="">All channels</option>
              {vocab?.channels.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {tab === "transactions" && (
              <select
                value={filters.category ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
                aria-label="Category filter"
                className="rounded-lg border border-ink-900/15 bg-surface-50 px-2.5 py-2 text-sm focus:border-accent-600 focus:outline-none"
              >
                <option value="">All categories</option>
                {vocab?.product_categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <input
              type="date"
              value={filters.date_from ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))}
              aria-label="From date"
              className="rounded-lg border border-ink-900/15 bg-surface-50 px-2.5 py-2 text-sm focus:border-accent-600 focus:outline-none"
            />
            <input
              type="date"
              value={filters.date_to ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))}
              aria-label="To date"
              className="rounded-lg border border-ink-900/15 bg-surface-50 px-2.5 py-2 text-sm focus:border-accent-600 focus:outline-none"
            />
            {(filters.channel || filters.category || filters.date_from || filters.date_to) && (
              <button onClick={() => setFilters({})} className="text-sm font-medium text-accent-600 hover:underline">
                Clear filters
              </button>
            )}
          </>
        )}

        {CRUD_TABS.includes(tab) && (
          <button
            onClick={() => setEditing({ mode: "create" })}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add {TAB_LABELS[tab].toLowerCase().replace(/s$/, "")}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-ink-900/10 bg-surface-50 py-2">
        <DataTable
          columns={columns}
          rows={list.rows}
          meta={list.meta}
          sort={sort}
          dir={dir}
          onSort={(key) => onSort(key)}
          onPage={setPage}
          loading={list.loading}
          error={list.error}
          onRetry={load}
          actions={actionButtons}
        />
      </div>

      {editing && CRUD_TABS.includes(tab) && (
        <Modal
          title={editing.mode === "create" ? `Add ${TAB_LABELS[tab].toLowerCase().replace(/s$/, "")}` : `Edit ${TAB_LABELS[tab].toLowerCase().replace(/s$/, "")}`}
          onClose={() => setEditing(null)}
        >
          {formErrors._form && <p className="mb-3 rounded-lg bg-negative-600/10 px-3 py-2 text-sm text-negative-600">{formErrors._form}</p>}
          <RecordForm
            fields={buildFields()}
            initial={editing.mode === "edit" ? Object.fromEntries(buildFields().map((f) => [f.key, String((editing.row as unknown as Record<string, unknown>)[f.key] ?? "")])) : {}}
            submitting={submitting}
            fieldErrors={formErrors}
            onCancel={() => setEditing(null)}
            onSubmit={saveRecord}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete record" onClose={() => setDeleting(null)}>
          <p className="text-sm text-ink-700">
            Delete <strong>{rowLabel(deleting)}</strong>? This cannot be undone.
            {tab === "customers" && " Their sales rows stay linked through cascade delete."}
            {tab === "campaigns" && " Sales from that week keep going, with their campaign cleared."}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-ink-900/15 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-ink-900/30"
            >
              Cancel
            </button>
            <button
              onClick={removeRecord}
              disabled={submitting}
              className="rounded-lg bg-negative-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
