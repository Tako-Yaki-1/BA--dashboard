import { api } from "./client";
import type {
  Campaign,
  Customer,
  FiltersMeta,
  ListParams,
  Paginated,
  Product,
  Sale,
  Transaction,
} from "../types";

/** Turns list params into a query string, skipping empty values. */
function qs(params: ListParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const getCustomers = (params: ListParams) =>
  api.get<Paginated<Customer>>(`/customers${qs(params)}`).then((r) => r.data);
export const createCustomer = (body: Omit<Customer, "id">) =>
  api.post<Customer>("/customers", body).then((r) => r.data);
export const updateCustomer = (id: number, body: Partial<Omit<Customer, "id">>) =>
  api.put<Customer>(`/customers/${id}`, body).then((r) => r.data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`);

export const getProducts = (params: ListParams) =>
  api.get<Paginated<Product>>(`/products${qs(params)}`).then((r) => r.data);
export const createProduct = (body: Omit<Product, "id">) =>
  api.post<Product>("/products", body).then((r) => r.data);
export const updateProduct = (id: number, body: Partial<Omit<Product, "id">>) =>
  api.put<Product>(`/products/${id}`, body).then((r) => r.data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

export const getCampaigns = (params: ListParams) =>
  api.get<Paginated<Campaign>>(`/marketing-campaigns${qs(params)}`).then((r) => r.data);
export const createCampaign = (body: Omit<Campaign, "id">) =>
  api.post<Campaign>("/marketing-campaigns", body).then((r) => r.data);
export const updateCampaign = (id: number, body: Partial<Omit<Campaign, "id">>) =>
  api.put<Campaign>(`/marketing-campaigns/${id}`, body).then((r) => r.data);
export const deleteCampaign = (id: number) => api.delete(`/marketing-campaigns/${id}`);

export const getSales = (params: ListParams) =>
  api.get<Paginated<Sale>>(`/sales${qs(params)}`).then((r) => r.data);
export const getTransactions = (params: ListParams) =>
  api.get<Paginated<Transaction>>(`/transactions${qs(params)}`).then((r) => r.data);

export const getMetaFilters = () =>
  api.get<FiltersMeta>("/meta/filters").then((r) => r.data);