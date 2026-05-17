import type { AdminCategory, AdminProduct, MenuResponse, Order, Station, Session, Tariff, SessionBill, Payment } from '@/types';

const API_BASE = '/api';

async function apiCall<T>(url: string, init?: RequestInit, useAuth: boolean = false): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const headers = { ...init?.headers } as Record<string, string>;

  if (useAuth) {
    // TODO: Implement proper auth token retrieval
    // For now, this endpoint requires auth but we don't have tokens
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`API error: ${res.status} - ${JSON.stringify(errorData)}`);
    }
    return res.json() as Promise<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('API request timed out (10s)');
    }
    throw error;
  }
}

const json = (body: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Customer API
export function fetchMenu(stationQr: string): Promise<MenuResponse> {
  return apiCall(`${API_BASE}/menu/${stationQr}`);
}

export function placeOrder(payload: {
  stationId: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
  sessionId?: string;
  taxRate?: number;
  serviceCharge?: number;
}): Promise<{ id: string }> {
  return apiCall(`${API_BASE}/orders`, { method: 'POST', ...json(payload) });
}

// Orders
export function fetchOrders(venueId: string, status?: string): Promise<Order[]> {
  const url = status
    ? `${API_BASE}/orders/${venueId}?status=${status}`
    : `${API_BASE}/orders/${venueId}`;
  return apiCall(url);
}

export function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  return apiCall(`${API_BASE}/orders/${orderId}/status`, { method: 'PATCH', ...json({ status }) });
}

// Categories
export function fetchCategories(venueId: string): Promise<AdminCategory[]> {
  return apiCall(`${API_BASE}/categories/venue/${venueId}`);
}

export function createCategory(payload: { venueId: string; name: string; sortOrder?: number }): Promise<AdminCategory> {
  return apiCall(`${API_BASE}/categories`, { method: 'POST', ...json(payload) });
}

export function updateCategory(id: string, payload: { name?: string; sortOrder?: number; isActive?: boolean }): Promise<AdminCategory> {
  return apiCall(`${API_BASE}/categories/${id}`, { method: 'PATCH', ...json(payload) });
}

export function deleteCategory(id: string): Promise<AdminCategory> {
  return apiCall(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
}

// Products
export function fetchProducts(venueId: string): Promise<AdminProduct[]> {
  return apiCall(`${API_BASE}/products/venue/${venueId}`);
}

export function createProduct(payload: {
  venueId: string; categoryId: string; name: string;
  description?: string; price: number; imageUrl?: string;
}): Promise<AdminProduct> {
  return apiCall(`${API_BASE}/products`, { method: 'POST', ...json(payload) });
}

export function updateProduct(id: string, payload: {
  categoryId?: string; name?: string; description?: string;
  price?: number; imageUrl?: string; isActive?: boolean;
}): Promise<AdminProduct> {
  return apiCall(`${API_BASE}/products/${id}`, { method: 'PATCH', ...json(payload) });
}

export function deleteProduct(id: string): Promise<AdminProduct> {
  return apiCall(`${API_BASE}/products/${id}`, { method: 'DELETE' });
}

// Stations
export function fetchStations(venueId: string): Promise<Station[]> {
  return apiCall(`${API_BASE}/stations/venue/${venueId}`);
}

export function createStation(payload: {
  venueId: string; name: string; stationType?: string; hourlyRate?: number;
}): Promise<Station> {
  return apiCall(`${API_BASE}/stations`, { method: 'POST', ...json(payload) });
}

export function updateStation(id: string, payload: {
  name?: string; stationType?: string; hourlyRate?: number; isActive?: boolean;
}): Promise<Station> {
  return apiCall(`${API_BASE}/stations/${id}`, { method: 'PATCH', ...json(payload) });
}

export function deleteStation(id: string): Promise<Station> {
  return apiCall(`${API_BASE}/stations/${id}`, { method: 'DELETE' });
}

export function regenerateStationQr(id: string): Promise<Station> {
  return apiCall(`${API_BASE}/stations/${id}/regenerate-qr`, { method: 'POST' });
}

// Sessions
export function fetchSessions(stationId: string): Promise<Session[]> {
  return apiCall(`${API_BASE}/sessions/station/${stationId}`);
}

export function fetchActiveSession(stationId: string): Promise<Session | null> {
  return apiCall(`${API_BASE}/sessions/station/${stationId}/active`);
}

export function startSession(payload: {
  stationId: string; isBillLess?: boolean; hourlyRate?: number;
}): Promise<Session> {
  return apiCall(`${API_BASE}/sessions`, { method: 'POST', ...json(payload) });
}

export function pauseSession(id: string): Promise<Session> {
  return apiCall(`${API_BASE}/sessions/${id}/pause`, { method: 'POST' });
}

export function resumeSession(id: string): Promise<Session> {
  return apiCall(`${API_BASE}/sessions/${id}/resume`, { method: 'POST' });
}

export function endSession(id: string): Promise<Session> {
  return apiCall(`${API_BASE}/sessions/${id}/end`, { method: 'POST' });
}

export function fetchSessionBill(id: string): Promise<SessionBill> {
  return apiCall(`${API_BASE}/sessions/${id}/bill`);
}

// Tariffs
export function fetchTariffs(venueId: string): Promise<Tariff[]> {
  return apiCall(`${API_BASE}/tariffs/venue/${venueId}`);
}

export function createTariff(payload: {
  venueId: string; name: string; stationType: string;
  ratePerHour: number; peakHourStart?: number; peakHourEnd?: number; peakRate?: number;
}): Promise<Tariff> {
  return apiCall(`${API_BASE}/tariffs`, { method: 'POST', ...json(payload) });
}

export function updateTariff(id: string, payload: Partial<{
  name: string; ratePerHour: number; peakHourStart: number; peakHourEnd: number; peakRate: number; isActive: boolean;
}>): Promise<Tariff> {
  return apiCall(`${API_BASE}/tariffs/${id}`, { method: 'PATCH', ...json(payload) });
}

export function deleteTariff(id: string): Promise<Tariff> {
  return apiCall(`${API_BASE}/tariffs/${id}`, { method: 'DELETE' });
}

// Payments
export function fetchOrderPayments(orderId: string): Promise<{ order: Order; paidTotal: number; remaining: number }> {
  return apiCall(`${API_BASE}/payments/order/${orderId}`);
}

export function addPayment(payload: {
  orderId: string; method: string; amount: number; note?: string;
}): Promise<{ payment: Payment; paidAmount: number; remaining: number; change: number }> {
  return apiCall(`${API_BASE}/payments`, { method: 'POST', ...json(payload) });
}

export function reversePayment(paymentId: string): Promise<{ deleted: string; newPaidAmount: number }> {
  return apiCall(`${API_BASE}/payments/${paymentId}/reverse`, { method: 'DELETE' });
}

// Analytics (requires auth)
export function fetchAnalyticsSummary(venueId: string): Promise<any> {
  return apiCall(`${API_BASE}/analytics/${venueId}/summary`, undefined, true);
}

export function fetchAnalyticsRevenue(venueId: string, period: '7d' | '30d' = '7d'): Promise<any[]> {
  return apiCall(`${API_BASE}/analytics/${venueId}/revenue?period=${period}`, undefined, true);
}

export function fetchAnalyticsTopProducts(venueId: string, limit: number = 10): Promise<any[]> {
  return apiCall(`${API_BASE}/analytics/${venueId}/top-products?limit=${limit}`, undefined, true);
}

export function fetchAnalyticsStationPerformance(venueId: string): Promise<any[]> {
  return apiCall(`${API_BASE}/analytics/${venueId}/station-performance`, undefined, true);
}

export function fetchAnalyticsHourlyHeatmap(venueId: string): Promise<any[]> {
  return apiCall(`${API_BASE}/analytics/${venueId}/hourly-heatmap`, undefined, true);
}

export function fetchAnalyticsPaymentDistribution(venueId: string): Promise<any[]> {
  return apiCall(`${API_BASE}/analytics/${venueId}/payment-distribution`, undefined, true);
}

export function fetchAnalyticsCategoryBreakdown(venueId: string): Promise<any[]> {
  return apiCall(`${API_BASE}/analytics/${venueId}/category-breakdown`, undefined, true);
}

// Order status (public for customers)
export function fetchOrderStatus(orderId: string): Promise<{ id: string; status: string; updatedAt: string }> {
  return apiCall(`${API_BASE}/orders/${orderId}/status`);
}
