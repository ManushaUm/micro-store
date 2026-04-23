import axios from 'axios';

const api = axios.create();

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let user = {};
    if (userStr && userStr !== 'undefined' && userStr !== '[object Object]') {
      try { user = JSON.parse(userStr); } catch(e) {}
    }
    
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (user.id) config.headers['x-user-id'] = user.id;
    if (user.role) config.headers['x-user-role'] = user.role;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('http://localhost:3001/auth/login', data).then(r => r.data),
  register: (data) => api.post('http://localhost:3001/auth/register', data).then(r => r.data),
  verify: () => api.get('http://localhost:3001/auth/verify').then(r => r.data)
};

export const catalogAPI = {
  getProducts: () => api.get('http://localhost:3002/products').then(r => r.data),
  getProduct: (id) => api.get(`http://localhost:3002/products/${id}`).then(r => r.data),
  seed: () => api.post('http://localhost:3002/products/seed').then(r => r.data),
  addProduct: (data) => api.post('http://localhost:3002/products', data).then(r => r.data),
};

export const cartAPI = {
  getCart: () => api.get('http://localhost:3003/cart').then(r => r.data),
  addToCart: (item) => api.post('http://localhost:3003/cart/items', item).then(r => r.data),
  removeFromCart: (productId) => api.delete(`http://localhost:3003/cart/items/${productId}`).then(r => r.data),
  clearCart: () => api.delete('http://localhost:3003/cart').then(r => r.data)
};

export const checkoutAPI = {
  placeOrder: (data) => api.post('http://localhost:3004/checkout', data).then(r => r.data),
  getOrders: () => api.get('http://localhost:3004/orders').then(r => r.data),
  getAdminOrders: () => api.get('http://localhost:3004/admin/orders').then(r => r.data),
  updateOrderStatus: (id, status) => api.put(`http://localhost:3004/admin/orders/${id}/status`, { status }).then(r => r.data)
};
