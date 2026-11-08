/** Strict types for every API response the app consumes. */

export interface Customer {
  id: number;
  name: string;
  customer_type: string;
  loyalty_tier: string;
  city: string;
  joined_date: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
}

export interface Campaign {
  id: number;
  week_start: string;
  channel: string;
  spend: number;
  discount_percent: number;
  reach: number;
}

export interface Sale {
  id: number;
  customer_id: number;
  customer_name?: string;
  campaign_id: number | null;
  channel?: string | null;
  week_start?: string | null;
  order_date: string;
  payment_method: string;
  total_amount: number;
}

export interface Transaction {
  id: number;
  sale_id: number;
  product_id: number;
  product_name?: string;
  product_category?: string;
  order_date?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

/** GET /meta/filters */
export interface FiltersMeta {
  channels: string[];
  product_categories: string[];
  customer_types: string[];
  loyalty_tiers: string[];
  date_from: string | null;
  date_to: string | null;
}

/** Pagination envelope Laravel returns for resource collections. */
export interface PageMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: PageMeta;
}

/** Query params for list endpoints: pagination + search + sort + resource filters. */
export interface ListParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
  [key: string]: string | number | undefined;
}

/** 422 error body the API uses consistently. */
export interface ApiErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

export type Tab = "customers" | "products" | "campaigns" | "sales" | "transactions";

/* ---------- analytics (Phase 4) ---------- */

/** Optional shared filters most analytics endpoints accept. */
export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  channel?: string;
}

/** GET /analytics/descriptive/summary */
export interface SummaryKpis {
  total_revenue: number;
  orders: number;
  average_order_value: number;
  total_spend: number;
  revenue_per_peso: number;
}

/** GET /analytics/descriptive/trend */
export interface TrendPoint {
  week_start: string;
  channel: string;
  spend: number;
  discount_percent: number;
  reach: number;
  orders: number;
  revenue: number;
}

export interface ChannelRow {
  channel: string;
  spend: number;
  revenue: number;
  orders: number;
  revenue_per_peso: number;
}

export interface CategoryRow {
  category: string;
  revenue: number;
  units: number;
}

export interface TopProduct {
  id: number;
  name: string;
  category: string;
  units: number;
  revenue: number;
}

export interface CategoryResponse {
  data: CategoryRow[];
  top_products: TopProduct[];
}

export interface CustomerSegment {
  segment: string;
  customers: number;
  revenue: number;
}

export interface CustomersResponse {
  by_type: CustomerSegment[];
  by_tier: CustomerSegment[];
}

/** One measured series: n, mean, median, min, max, range, sample SD. */
export interface StatsBlock {
  n: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  sd: number;
}

export interface StatisticsResponse {
  weekly_revenue: StatsBlock;
  weekly_spend: StatsBlock;
  discount_percent: StatsBlock;
  order_value: StatsBlock;
}

export interface CorrelationResponse {
  variables: string[];
  matrix: number[][];
}

/* ---------- predictive (Phase 5) ---------- */

export interface ModelResponse {
  outcome?: string;
  predictors?: string[];
  intercept?: number;
  coefficients?: {
    spend: number;
    discount_percent: number;
  };
  r_squared?: number;
  adjusted_r_squared?: number;
  rmse?: number;
  n_weeks?: number;
  interpretation?: {
    spend: string;
    discount_percent: string;
    fit: string;
  };
  message?: string;
}

export interface AvpPoint {
  week_start: string;
  spend: number;
  discount_percent: number;
  actual: number;
  predicted: number;
}

export interface ForecastPoint {
  week_start: string;
  projected_revenue: number;
}

export interface ForecastResponse {
  method: string;
  note?: string;
  data: ForecastPoint[];
}

export interface PredictResponse {
  spend?: number;
  discount_percent?: number;
  predicted_weekly_revenue?: number;
  note?: string;
  message?: string;
}

/* ---------- prescriptive (Phase 6) ---------- */

export interface ChannelRoiRow {
  channel: string;
  revenue: number;
  spend: number;
  roi: number;
}

export interface ChannelRoiResponse {
  method: string;
  data: ChannelRoiRow[];
}

export interface AllocateRequestPayload {
  total_budget: number;
  min_share?: number;
  max_share?: number;
}

export interface AllocationRow {
  channel: string;
  allocated_pesos: number;
  share_percent: number;
  expected_revenue: number;
}

export interface AllocateResponse {
  total_budget: number;
  allocations: AllocationRow[];
  expected_revenue: number;
  even_split_revenue: number;
  uplift_percent: number;
  rule: string;
}

export interface WhatIfResponse {
  pct_change: number;
  baseline_weekly_budget: number;
  baseline_weekly_revenue: number;
  new_weekly_budget: number;
  projected_weekly_revenue: number;
  note: string;
  mix?: Array<{ channel: string; allocated_pesos: number; expected_revenue: number }>;
}

export interface Recommendation {
  rank: number;
  title: string;
  detail: string;
}

export type StageName = "descriptive" | "predictive" | "prescriptive";

export interface ProcessSummaryResponse {
  stages: Record<StageName, { finding: string; hands_to_next: string }>;
}

export interface CountsResponse {
  customers: number;
  products: number;
  campaigns: number;
  sales: number;
  transactions: number;
}
