/**
 * Fundraiser API service
 * Centralizes all fundraiser-related API calls
 */

import api from './api';
import type {
  Fundraiser,
  FundraiserProduct,
  AvailableProduct,
  Participant,
  FundraiserOrder,
  FundraiserStats,
  BulkImportResult,
} from '../types/fundraiser';

interface FundraiserListResponse {
  fundraisers: Fundraiser[];
  pagination?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

interface FundraiserResponse {
  fundraiser: Fundraiser;
}

interface ParticipantsResponse {
  participants: Participant[];
}

interface ParticipantResponse {
  participant: Participant;
}

interface ProductsResponse {
  products: FundraiserProduct[];
}

interface AvailableProductsResponse {
  products: AvailableProduct[];
}

interface OrdersResponse {
  orders: FundraiserOrder[];
  pagination?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

interface StatsResponse {
  stats: FundraiserStats;
}

// ============ Fundraisers ============

export async function getFundraisers(
  token: string,
  params?: { search?: string; status?: string; page?: number; per_page?: number }
): Promise<FundraiserListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

  const response = await api.get<FundraiserListResponse>(
    `/admin/fundraisers?${queryParams}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function getFundraiser(
  token: string,
  id: number | string
): Promise<Fundraiser> {
  const response = await api.get<FundraiserResponse>(
    `/admin/fundraisers/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.fundraiser;
}

export async function createFundraiser(
  token: string,
  data: Partial<Fundraiser>
): Promise<Fundraiser> {
  const response = await api.post<FundraiserResponse>(
    '/admin/fundraisers',
    { fundraiser: data },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.fundraiser;
}

export async function updateFundraiser(
  token: string,
  id: number | string,
  data: Partial<Fundraiser>
): Promise<Fundraiser> {
  const response = await api.put<FundraiserResponse>(
    `/admin/fundraisers/${id}`,
    { fundraiser: data },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.fundraiser;
}

export async function deleteFundraiser(
  token: string,
  id: number | string
): Promise<void> {
  await api.delete(`/admin/fundraisers/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============ Fundraiser Products ============

export async function getFundraiserProducts(
  token: string,
  fundraiserId: number | string
): Promise<FundraiserProduct[]> {
  const response = await api.get<ProductsResponse>(
    `/admin/fundraisers/${fundraiserId}/products`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.products;
}

export async function getAvailableProducts(
  token: string,
  fundraiserId: number | string
): Promise<AvailableProduct[]> {
  const response = await api.get<AvailableProductsResponse>(
    `/admin/fundraisers/${fundraiserId}/products/available`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.products;
}

export async function addProductToFundraiser(
  token: string,
  fundraiserId: number | string,
  productId: number,
  priceCents: number
): Promise<FundraiserProduct> {
  const response = await api.post<{ product: FundraiserProduct }>(
    `/admin/fundraisers/${fundraiserId}/products`,
    { fundraiser_product: { product_id: productId, price_cents: priceCents } },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.product;
}

export async function updateFundraiserProduct(
  token: string,
  fundraiserId: number | string,
  productId: number | string,
  data: { price_cents?: number; position?: number; active?: boolean }
): Promise<FundraiserProduct> {
  const response = await api.patch<{ product: FundraiserProduct }>(
    `/admin/fundraisers/${fundraiserId}/products/${productId}`,
    { fundraiser_product: data },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.product;
}

export async function removeProductFromFundraiser(
  token: string,
  fundraiserId: number | string,
  productId: number | string
): Promise<void> {
  await api.delete(`/admin/fundraisers/${fundraiserId}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============ Participants ============

export async function getParticipants(
  token: string,
  fundraiserId: number | string,
  params?: { search?: string; active?: boolean }
): Promise<Participant[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.active !== undefined) queryParams.append('active', params.active.toString());

  const response = await api.get<ParticipantsResponse>(
    `/admin/fundraisers/${fundraiserId}/participants?${queryParams}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.participants;
}

export async function getParticipant(
  token: string,
  fundraiserId: number | string,
  participantId: number | string
): Promise<Participant> {
  const response = await api.get<ParticipantResponse>(
    `/admin/fundraisers/${fundraiserId}/participants/${participantId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.participant;
}

export async function createParticipant(
  token: string,
  fundraiserId: number | string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    participant_number?: string;
    goal_amount_cents?: number;
  }
): Promise<Participant> {
  const response = await api.post<ParticipantResponse>(
    `/admin/fundraisers/${fundraiserId}/participants`,
    { participant: data },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.participant;
}

export async function updateParticipant(
  token: string,
  fundraiserId: number | string,
  participantId: number | string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    participant_number: string;
    goal_amount_cents: number;
    active: boolean;
  }>
): Promise<Participant> {
  const response = await api.patch<ParticipantResponse>(
    `/admin/fundraisers/${fundraiserId}/participants/${participantId}`,
    { participant: data },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.participant;
}

export async function deleteParticipant(
  token: string,
  fundraiserId: number | string,
  participantId: number | string
): Promise<void> {
  await api.delete(
    `/admin/fundraisers/${fundraiserId}/participants/${participantId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function bulkImportParticipants(
  token: string,
  fundraiserId: number | string,
  csvContent: string
): Promise<BulkImportResult> {
  const response = await api.post<BulkImportResult>(
    `/admin/fundraisers/${fundraiserId}/participants/bulk_import`,
    { csv: csvContent },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// ============ Orders ============

export async function getFundraiserOrders(
  token: string,
  fundraiserId: number | string,
  params?: { page?: number; per_page?: number; status?: string }
): Promise<OrdersResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params?.status) queryParams.append('status', params.status);

  const response = await api.get<OrdersResponse>(
    `/admin/fundraisers/${fundraiserId}/orders?${queryParams}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function updateFundraiserOrderStatus(
  token: string,
  fundraiserId: number | string,
  orderId: number | string,
  status: string
): Promise<FundraiserOrder> {
  const response = await api.patch<{ order: FundraiserOrder }>(
    `/admin/fundraisers/${fundraiserId}/orders/${orderId}`,
    { order: { status } },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.order;
}

// ============ Stats ============

export async function getFundraiserStats(
  token: string,
  fundraiserId: number | string
): Promise<FundraiserStats> {
  const response = await api.get<StatsResponse>(
    `/admin/fundraisers/${fundraiserId}/stats`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.stats;
}

// ============ Public API (for customer-facing pages) ============

export async function getPublicFundraiser(slug: string): Promise<Fundraiser> {
  const response = await api.get<FundraiserResponse>(`/fundraisers/${slug}`);
  return response.data.fundraiser;
}

export async function getPublicFundraiserProducts(
  slug: string
): Promise<FundraiserProduct[]> {
  const response = await api.get<ProductsResponse>(`/fundraisers/${slug}/products`);
  return response.data.products;
}
