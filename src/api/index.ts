import api from './axios'
import type { Product, Cart, CartTotals, Order, Address, Coupon, Review, Banner, Category, User } from '../types'

// ─── Auth ───────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  getMe: () => api.get('/auth/me'),

  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),

  updateProfile: (data: Partial<User>) => api.put('/auth/update-profile', data),
}

// ─── Products ───────────────────────────────────────
export const productAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),

  getById: (id: string) => api.get(`/products/${id}`),

  getTrending: () => api.get('/products/trending'),

  getFeatured: () => api.get('/products/featured'),

  autocomplete: (q: string) => api.get('/products/autocomplete', { params: { q } }),

  create: (data: FormData) =>
    api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  update: (id: string, data: Partial<Product>) => api.put(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),

  addImages: (id: string, data: FormData) =>
    api.post(`/products/${id}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ─── Categories ─────────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data: FormData) =>
    api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

// ─── Cart ────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get<{ cart: Cart; totals: CartTotals }>('/cart'),

  add: (productId: string, quantity = 1) =>
    api.post('/cart/add', { productId, quantity }),

  update: (productId: string, quantity: number) =>
    api.put('/cart/update', { productId, quantity }),

  remove: (productId: string) => api.delete(`/cart/remove/${productId}`),

  applyCoupon: (code: string) => api.post('/cart/apply-coupon', { code }),

  removeCoupon: () => api.delete('/cart/remove-coupon'),

  clear: () => api.delete('/cart/clear'),
}

// ─── Orders ─────────────────────────────────────────
export const orderAPI = {
  create: (data: { addressId: string; paymentMethod: string }) =>
    api.post('/orders', data),

  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),

  getById: (id: string) => api.get(`/orders/${id}`),

  cancel: (id: string, reason: string) =>
    api.put(`/orders/${id}/cancel`, { reason }),

  requestReturn: (id: string, reason: string) =>
    api.post(`/orders/${id}/return`, { reason }),

  getInvoice: (id: string) =>
    api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),

  // Admin
  adminGetAll: (params?: Record<string, unknown>) =>
    api.get('/orders/admin/all', { params }),

  adminUpdateStatus: (id: string, status: string, note?: string) =>
    api.put(`/orders/admin/${id}/status`, { status, note }),

  adminAssignDelivery: (id: string, deliveryPartnerId: string) =>
    api.put(`/orders/admin/${id}/assign`, { deliveryPartnerId }),

  getAvailablePartners: () =>
    api.get('/orders/admin/partners'),
}

// ─── Payment ─────────────────────────────────────────
export const paymentAPI = {
  createRazorpayOrder: (orderId: string) =>
    api.post('/payments/razorpay/create-order', { orderId }),

  verifyRazorpay: (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    orderId: string
  }) => api.post('/payments/razorpay/verify', data),

  createStripeIntent: (orderId: string) =>
    api.post('/payments/stripe/create-intent', { orderId }),

  confirmCOD: (orderId: string) =>
    api.post('/payments/cod/confirm', { orderId }),
}

// ─── Address ─────────────────────────────────────────
export const addressAPI = {
  getAll: () => api.get('/addresses'),
  create: (data: Omit<Address, '_id'>) => api.post('/addresses', data),
  update: (id: string, data: Partial<Address>) => api.put(`/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
}

// ─── Reviews ─────────────────────────────────────────
export const reviewAPI = {
  getByProduct: (productId: string, params?: Record<string, unknown>) =>
    api.get(`/reviews/product/${productId}`, { params }),
  create: (data: { productId: string; orderId: string; rating: number; title?: string; comment?: string }) =>
    api.post('/reviews', data),
  markHelpful: (id: string) => api.put(`/reviews/${id}/helpful`),
  delete: (id: string) => api.delete(`/reviews/${id}`),
}

// ─── Coupons ─────────────────────────────────────────
export const couponAPI = {
  validate: (code: string, orderAmount: number) =>
    api.post('/coupons/validate', { code, orderAmount }),
  getAll: () => api.get('/coupons'),
  create: (data: Partial<Coupon>) => api.post('/coupons', data),
  update: (id: string, data: Partial<Coupon>) => api.put(`/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/${id}`),
}

// ─── Banners ─────────────────────────────────────────
export const bannerAPI = {
  getAll: () => api.get('/banners'),
  create: (data: FormData) =>
    api.post('/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: Partial<Banner>) => api.put(`/banners/${id}`, data),
  delete: (id: string) => api.delete(`/banners/${id}`),
}

// ─── Admin ───────────────────────────────────────────
export const adminAPI = {
  getDashboard:   () => api.get('/admin/dashboard'),
  getUsers:       (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  toggleBlock:    (id: string) => api.put(`/admin/users/${id}/block`),
  getSalesReport: (params?: Record<string, unknown>) => api.get('/admin/reports/sales', { params }),
}

// ─── AI ──────────────────────────────────────────────
export const aiAPI = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    api.post('/ai/chat', { message, history }),
  search: (query: string) => api.post('/ai/search', { query }),
  getRecommendations: () => api.get('/ai/recommendations'),
}

// ─── Delivery ─────────────────────────────────────────
export const deliveryAPI = {
  getOrders:          (params?: Record<string, unknown>) => api.get('/delivery/orders', { params }),
  getHistory:         (params?: Record<string, unknown>) => api.get('/delivery/history', { params }),
  acceptOrder:        (id: string) => api.put(`/delivery/orders/${id}/accept`),
  rejectOrder:        (id: string, reason?: string) => api.put(`/delivery/orders/${id}/reject`, { reason }),
  updateStatus:       (id: string, status: string, note?: string) => api.put(`/delivery/orders/${id}/status`, { status, note }),
  updateLocation:     (data: { latitude: number; longitude: number; orderId?: string }) => api.put('/delivery/location', data),
  toggleAvailability: (isAvailable: boolean) => api.put('/delivery/availability', { isAvailable }),
  getStats:           () => api.get('/delivery/stats'),
  requestOTP:         (orderId: string) => api.post(`/orders/${orderId}/request-delivery-otp`),
  verifyOTP:          (orderId: string, otp: string) => api.post(`/orders/${orderId}/verify-delivery-otp`, { otp }),
}

// ─── Wishlist ─────────────────────────────────────────
export const wishlistAPI = {
  get: () => api.get('/users/wishlist'),
  toggle: (productId: string) => api.post('/users/wishlist/toggle', { productId }),
}
