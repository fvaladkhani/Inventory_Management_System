import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api' : '/api'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// All list endpoints use Laravel pagination, while older lookup endpoints may
// return a plain array. Keep consumers independent from that implementation detail.
export const getCollection = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const formatDecimal = (value, digits = 2) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : (0).toFixed(digits);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  changePassword: (data) => api.post('/change-password', data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getInventoryOverview: () => api.get('/dashboard/inventory-overview'),
  getSalesTrends: (months = 12) => api.get(`/dashboard/sales-trends?months=${months}`),
  getTopProducts: (limit = 10, type = 'quantity') => api.get(`/dashboard/top-products?limit=${limit}&type=${type}`),
  getWarehouseUtilization: () => api.get('/dashboard/warehouse-utilization'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// Products API
export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products-low-stock'),
  getImage: (id) => api.get(`/products/${id}/image`, { responseType: 'blob' }),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params = {}) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  getSummary: () => api.get('/inventory-summary'),
  getMovements: (params = {}) => api.get('/inventory-movements', { params }),
};

// Customers API
export const customersAPI = {
  getAll: (params = {}) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Vendors API
export const vendorsAPI = {
  getAll: (params = {}) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Warehouses API
export const warehousesAPI = {
  getAll: (params = {}) => api.get('/warehouses', { params }),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

// Inbound Orders API
export const inboundOrdersAPI = {
  getAll: (params = {}) => api.get('/inbound-orders', { params }),
  getById: (id) => api.get(`/inbound-orders/${id}`),
  create: (data) => api.post('/inbound-orders', data),
  update: (id, data) => api.put(`/inbound-orders/${id}`, data),
  delete: (id) => api.delete(`/inbound-orders/${id}`),
  receive: (id) => api.post(`/inbound-orders/${id}/receive`),
};

// Outbound Orders API
export const outboundOrdersAPI = {
  getAll: (params = {}) => api.get('/outbound-orders', { params }),
  getById: (id) => api.get(`/outbound-orders/${id}`),
  create: (data) => api.post('/outbound-orders', data),
  update: (id, data) => api.put(`/outbound-orders/${id}`, data),
  delete: (id) => api.delete(`/outbound-orders/${id}`),
  ship: (id) => api.post(`/outbound-orders/${id}/ship`),
};

// Order Statuses API
export const orderStatusesAPI = {
  getAll: () => api.get('/order-statuses'),
  create: (data) => api.post('/order-statuses', data),
  update: (id, data) => api.put(`/order-statuses/${id}`, data),
  delete: (id) => api.delete(`/order-statuses/${id}`),
};

// Transaction Types API
export const transactionTypesAPI = {
  getAll: () => api.get('/transaction-types'),
  create: (data) => api.post('/transaction-types', data),
  update: (id, data) => api.put(`/transaction-types/${id}`, data),
  delete: (id) => api.delete(`/transaction-types/${id}`),
};


// Settings API
export const settingsAPI = {
  getAll: (params = {}) => api.get('/settings', { params }),
  getGroup: (group) => api.get('/settings', { params: { group } }),
  create: (data) => api.post('/settings', data),
  update: (key, data) => api.put(`/settings/${key}`, data),
  delete: (key) => api.delete(`/settings/${key}`),
  initialize: () => api.post('/settings/initialize'),
};

// Lookup APIs
export const lookupAPI = {
  getProductCategories: () => api.get('/product-categories', { params: { per_page: 100 } }),
  getOrderStatuses: () => api.get('/order-statuses', { params: { per_page: 100 } }),
  getTransactionTypes: () => api.get('/transaction-types', { params: { per_page: 100 } }),
};

export default api;


// Product Categories API (CRUD کامل)
export const productCategoriesAPI = {
  getAll: (params = {}) => api.get('/product-categories', { params }),
  getById: (id) => api.get(`/product-categories/${id}`),
  create: (data) => api.post('/product-categories', data),
  update: (id, data) => api.put(`/product-categories/${id}`, data),
  delete: (id) => api.delete(`/product-categories/${id}`),
};

// Product Variants API (CRUD کامل)
export const productVariantsAPI = {
  getAll: (params = {}) => api.get('/product-variants', { params }),
  getById: (id) => api.get(`/product-variants/${id}`),
  create: (data) => api.post('/product-variants', data),
  update: (id, data) => api.put(`/product-variants/${id}`, data),
  delete: (id) => api.delete(`/product-variants/${id}`),
};

// Users API (CRUD کامل)
export const usersAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Product Bundles API (CRUD کامل)
export const productBundlesAPI = {
  getAll: (params = {}) => api.get('/product-bundles', { params }),
  getById: (id) => api.get(`/product-bundles/${id}`),
  create: (data) => api.post('/product-bundles', data),
  update: (id, data) => api.put(`/product-bundles/${id}`, data),
  delete: (id) => api.delete(`/product-bundles/${id}`),
};

// Product Offers API (CRUD کامل)
export const productOffersAPI = {
  getAll: (params = {}) => api.get('/product-offers', { params }),
  getById: (id) => api.get(`/product-offers/${id}`),
  create: (data) => api.post('/product-offers', data),
  update: (id, data) => api.put(`/product-offers/${id}`, data),
  delete: (id) => api.delete(`/product-offers/${id}`),
};