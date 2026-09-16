const API_BASE = '/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || 'Request failed');
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request('/auth/me'),

  // Customers
  getCustomers: () => request('/customers'),
  createCustomer: (customerData) =>
    request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),

  // Products
  getProducts: () => request('/products'),
  createProduct: (productData) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  // Inventory
  getInventory: () => request('/inventory'),
  updatePhysicalStock: (productId, physical_quantity) =>
    request(`/inventory/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ physical_quantity }),
    }),

  // Enquiries
  getEnquiries: () => request('/enquiries'),
  getEnquiryById: (id) => request(`/enquiries/${id}`),
  createEnquiry: (enquiryData) =>
    request('/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiryData),
    }),

  // Quotations
  getQuotations: () => request('/quotations'),
  getQuotationById: (id) => request(`/quotations/${id}`),
  createQuotation: (quotationData) =>
    request('/quotations', {
      method: 'POST',
      body: JSON.stringify(quotationData),
    }),
  updateQuotationStatus: (id, status) =>
    request(`/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  convertToSalesOrder: (id) =>
    request(`/quotations/${id}/convert`, {
      method: 'POST',
    }),

  // Sales Orders
  getSalesOrders: () => request('/sales-orders'),
  getSalesOrderById: (id) => request(`/sales-orders/${id}`),
  confirmSalesOrder: (id) =>
    request(`/sales-orders/${id}/confirm`, {
      method: 'POST',
    }),
  dispatchSalesOrder: (id, dispatchData) =>
    request(`/sales-orders/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(dispatchData),
    }),
  cancelSalesOrder: (id) =>
    request(`/sales-orders/${id}/cancel`, {
      method: 'POST',
    }),

  // Traceability
  getTraceability: (type, id) => request(`/traceability/${type}/${id}`),
};
