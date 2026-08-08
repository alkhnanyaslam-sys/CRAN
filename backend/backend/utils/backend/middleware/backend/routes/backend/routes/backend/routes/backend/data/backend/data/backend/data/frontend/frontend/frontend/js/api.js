// js/api.js
// Small wrapper around fetch() so the rest of the frontend never
// has to think about URLs, headers, or JSON parsing directly.
// Change API_BASE if the backend is deployed on a different domain.

const API_BASE = ''; // e.g. 'https://crwn-backend.onrender.com' when deployed separately

const Api = {
  async getProducts() {
    const res = await fetch(`${API_BASE}/api/products`);
    return res.json();
  },

  async placeOrder(payload) {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ أثناء تنفيذ الطلب');
    return data;
  },

  async login(pin) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
    return data;
  },

  async changePin(newPin, token) {
    const res = await fetch(`${API_BASE}/api/auth/change-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ newPin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تغيير الرقم السري');
    return data;
  },

  async getOrders(token) {
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('فشل تحميل الطلبات');
    return res.json();
  },

  async updateOrderStatus(id, status, token) {
    const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('فشل تحديث حالة الطلب');
    return res.json();
  },

  async addProduct(product, token) {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إضافة المنتج');
    return data;
  },

  async deleteProduct(id, token) {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) throw new Error('فشل حذف المنتج');
    return res.json();
  },
};
