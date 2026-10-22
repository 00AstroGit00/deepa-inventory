let keyCounter = 0;
const newKey = () =>
  (globalThis.crypto?.randomUUID?.() ?? `k-${Date.now()}-${++keyCounter}`);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface Row {
  productId: string; productName: string; unit: string;
  opening: number; receipts: number; consumption: number; spillage: number;
  transferIn: number; transferOut: number; adjustments: number;
  expectedClosing: number; physicalCount: number | null; variance: number | null;
}
export interface DayResponse { date: string; status: string; rows: Row[]; }

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'opening' | 'receipt' | 'transfer_in' | 'transfer_out' | 'consumption' | 'spillage' | 'adjustment';
  amount: number;
  unit: string;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}
export interface MovementsResponse { movements: Movement[]; }

export const api = {
  me: () => request<{ id: string; email: string; role: string }>('/auth/me'),
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  day: (date: string) => request<DayResponse>(`/inventory/${date}`),
  movements: (date: string) => request<MovementsResponse>(`/inventory/${date}/movements`),
  saveCount: (date: string, productId: string, amount: number, unit: string) =>
    request(`/inventory/${date}/counts`, {
      method: 'POST',
      headers: { 'Idempotency-Key': newKey() },
      body: JSON.stringify({ productId, amount, unit }),
    }),
  createMovement: (date: string, productId: string, type: string, amount: number, unit: string, reason: string) =>
    request(`/inventory/${date}/movements`, {
      method: 'POST',
      headers: { 'Idempotency-Key': newKey() },
      body: JSON.stringify({ productId, type, amount, unit, reason }),
    }),
  syncOpening: (date: string) =>
    request<{ applied: number; skipped: number }>(`/inventory/${date}/sync-opening`, {
      method: 'POST',
      headers: { 'Idempotency-Key': newKey() },
      body: JSON.stringify({}),
    }),
  products: (q = '') => request<any[]>(`/products?q=${encodeURIComponent(q)}`),
  createProduct: (p: unknown) =>
    request('/products', { method: 'POST', body: JSON.stringify(p) }),
  updateProduct: (id: string, p: unknown) =>
    request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  dashboard: () => request<any>('/reports/dashboard'),

  // Suppliers
  suppliers: (q = '') => request<any[]>(`/suppliers?q=${encodeURIComponent(q)}`),
  createSupplier: (s: unknown) =>
    request('/suppliers', { method: 'POST', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify(s) }),
  updateSupplier: (id: string, s: unknown) =>
    request(`/suppliers/${id}`, { method: 'PATCH', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify(s) }),
  deleteSupplier: (id: string) =>
    request(`/suppliers/${id}`, { method: 'DELETE', headers: { 'Idempotency-Key': newKey() } }),

  // Product Suppliers
  productSuppliers: (productId: string) => request<any[]>(`/product-suppliers/product/${productId}`),
  supplierProducts: (supplierId: string) => request<any[]>(`/product-suppliers/supplier/${supplierId}`),
  createProductSupplier: (ps: unknown) =>
    request('/product-suppliers', { method: 'POST', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify(ps) }),
  updateProductSupplier: (productId: string, supplierId: string, ps: unknown) =>
    request(`/product-suppliers/${productId}/${supplierId}`, { method: 'PATCH', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify(ps) }),
  deleteProductSupplier: (productId: string, supplierId: string) =>
    request(`/product-suppliers/${productId}/${supplierId}`, { method: 'DELETE', headers: { 'Idempotency-Key': newKey() } }),

  // Purchase Orders
  purchaseOrders: (params: { status?: string; supplierId?: string; limit?: number; offset?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.status) sp.set('status', params.status);
    if (params.supplierId) sp.set('supplierId', params.supplierId);
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.offset) sp.set('offset', String(params.offset));
    return request<any[]>(`/purchase-orders?${sp.toString()}`);
  },
  purchaseOrder: (id: string) => request<any>(`/purchase-orders/${id}`),
  createPurchaseOrder: (po: unknown) =>
    request('/purchase-orders', { method: 'POST', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify(po) }),
  updatePoStatus: (id: string, status: string) =>
    request(`/purchase-orders/${id}/status`, { method: 'PATCH', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify({ status }) }),
  updatePurchaseOrder: (id: string, po: unknown) =>
    request(`/purchase-orders/${id}`, { method: 'PATCH', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify(po) }),

  // Goods Receipts
  goodsReceipts: (params: { poId?: string; supplierId?: string; limit?: number; offset?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.poId) sp.set('poId', params.poId);
    if (params.supplierId) sp.set('supplierId', params.supplierId);
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.offset) sp.set('offset', String(params.offset));
    return request<any[]>(`/goods-receipts?${sp.toString()}`);
  },
  goodsReceipt: (id: string) => request<any>(`/goods-receipts/${id}`),
  createGoodsReceipt: (gr: unknown) =>
    request('/goods-receipts', { method: 'POST', headers: { 'Idempotency-Key': newKey() }, body: JSON.stringify(gr) }),

  // Reports
  stockMovements: (params: { from?: string; to?: string; productId?: string; type?: string; limit?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.from) sp.set('from', params.from);
    if (params.to) sp.set('to', params.to);
    if (params.productId) sp.set('productId', params.productId);
    if (params.type) sp.set('type', params.type);
    if (params.limit) sp.set('limit', String(params.limit));
    return request<any[]>(`/reports/stock-movements?${sp.toString()}`);
  },
  stockMovementsCsv: (params: { from?: string; to?: string; productId?: string; type?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.from) sp.set('from', params.from);
    if (params.to) sp.set('to', params.to);
    if (params.productId) sp.set('productId', params.productId);
    if (params.type) sp.set('type', params.type);
    return fetch(`/api/reports/stock-movements.csv?${sp.toString()}`, { credentials: 'include' });
  },
  spillageAdjustments: (params: { from?: string; to?: string; type?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.from) sp.set('from', params.from);
    if (params.to) sp.set('to', params.to);
    if (params.type) sp.set('type', params.type);
    return request<any[]>(`/reports/spillage-adjustments?${sp.toString()}`);
  },
  spillageAdjustmentsCsv: (params: { from?: string; to?: string; type?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.from) sp.set('from', params.from);
    if (params.to) sp.set('to', params.to);
    if (params.type) sp.set('type', params.type);
    return fetch(`/api/reports/spillage-adjustments.csv?${sp.toString()}`, { credentials: 'include' });
  },
  purchaseCostHistory: (params: { productId?: string; supplierId?: string; limit?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.productId) sp.set('productId', params.productId);
    if (params.supplierId) sp.set('supplierId', params.supplierId);
    if (params.limit) sp.set('limit', String(params.limit));
    return request<any[]>(`/reports/purchase-cost-history?${sp.toString()}`);
  },
  purchaseCostHistoryCsv: (params: { productId?: string; supplierId?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.productId) sp.set('productId', params.productId);
    if (params.supplierId) sp.set('supplierId', params.supplierId);
    return fetch(`/api/reports/purchase-cost-history.csv?${sp.toString()}`, { credentials: 'include' });
  },
  valuation: () => request<{ items: any[]; totalValue: number }>(`/reports/valuation`),
  valuationCsv: () => fetch(`/api/reports/valuation.csv`, { credentials: 'include' }),
  stockHealth: () => request<any[]>(`/reports/stock-health`),
  stockHealthCsv: () => fetch(`/api/reports/stock-health.csv`, { credentials: 'include' }),
};