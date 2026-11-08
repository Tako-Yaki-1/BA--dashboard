import { api } from "./client";
import type {
  AllocateRequestPayload,
  AllocateResponse,
  AnalyticsFilters,
  AvpPoint,
  CategoryResponse,
  ChannelRoiResponse,
  ChannelRow,
  CountsResponse,
  CorrelationResponse,
  CustomersResponse,
  ForecastResponse,
  ModelResponse,
  PredictResponse,
  ProcessSummaryResponse,
  Recommendation,
  StatisticsResponse,
  SummaryKpis,
  TrendPoint,
  WhatIfResponse,
} from "../types";

/** Builds the ?date_from=&date_to=&channel= query for analytics endpoints. */
function qs(f: AnalyticsFilters): string {
  const s = new URLSearchParams();
  if (f.date_from) s.set("date_from", f.date_from);
  if (f.date_to) s.set("date_to", f.date_to);
  if (f.channel) s.set("channel", f.channel);
  const q = s.toString();
  return q ? `?${q}` : "";
}

export const getSummary = (f: AnalyticsFilters) =>
  api.get<SummaryKpis>(`/analytics/descriptive/summary${qs(f)}`).then((r) => r.data);
export const getTrend = (f: AnalyticsFilters) =>
  api.get<{ data: TrendPoint[] }>(`/analytics/descriptive/trend${qs(f)}`).then((r) => r.data);
export const getByChannel = (f: AnalyticsFilters) =>
  api.get<{ data: ChannelRow[] }>(`/analytics/descriptive/by-channel${qs(f)}`).then((r) => r.data);
export const getByCategory = (f: AnalyticsFilters) =>
  api.get<CategoryResponse>(`/analytics/descriptive/by-category${qs(f)}`).then((r) => r.data);
export const getCustomersBreakdown = (f: AnalyticsFilters) =>
  api.get<CustomersResponse>(`/analytics/descriptive/customers${qs(f)}`).then((r) => r.data);
export const getStatistics = (f: AnalyticsFilters) =>
  api.get<StatisticsResponse>(`/analytics/descriptive/statistics${qs(f)}`).then((r) => r.data);
export const getCorrelation = (f: AnalyticsFilters) =>
  api.get<CorrelationResponse>(`/analytics/descriptive/correlation${qs(f)}`).then((r) => r.data);

/* predictive */
export const getModel = (f: AnalyticsFilters) =>
  api.get<ModelResponse>(`/analytics/predictive/model${qs(f)}`).then((r) => r.data);
export const getActualVsPredicted = (f: AnalyticsFilters) =>
  api.get<{ data: AvpPoint[] }>(`/analytics/predictive/actual-vs-predicted${qs(f)}`).then((r) => r.data);
export const getForecast = (f: AnalyticsFilters) =>
  api.get<ForecastResponse>(`/analytics/predictive/forecast${qs(f)}`).then((r) => r.data);
export const postPredict = (body: { spend: number; discount_percent: number }) =>
  api.post<PredictResponse>("/analytics/predictive/predict", body).then((r) => r.data);

/* prescriptive */
export const getChannelRoi = () =>
  api.get<ChannelRoiResponse>("/analytics/prescriptive/channel-roi").then((r) => r.data);
export const postAllocate = (body: AllocateRequestPayload) =>
  api.post<AllocateResponse>("/analytics/prescriptive/allocate", body).then((r) => r.data);
export const postWhatIf = (body: { pct_change: number }) =>
  api.post<WhatIfResponse>("/analytics/prescriptive/what-if", body).then((r) => r.data);
export const getRecommendations = () =>
  api.get<{ data: Recommendation[] }>("/analytics/prescriptive/recommendations").then((r) => r.data);
export const getProcessSummary = () =>
  api.get<ProcessSummaryResponse>("/analytics/process-summary").then((r) => r.data);
export const getMetaCounts = () =>
  api.get<CountsResponse>("/meta/counts").then((r) => r.data);
