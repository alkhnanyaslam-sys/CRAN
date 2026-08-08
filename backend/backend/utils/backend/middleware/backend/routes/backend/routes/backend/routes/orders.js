// routes/orders.js
// Public: customers can place an order (stock gets deducted here).
// Admin-only: view all orders and update their status.

const express = require('express');
const { readData, writeData } = require('../utils/db');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

const PHONE_REGEX = /^01[0-9]{9}$/;

// POST /api/orders — public: place a new order
router.post('/', (req, res) => {
  const { items, customer, payment } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'السلة فاضية' });
  }
  if (!customer || !customer.name || !customer.phone || !customer.city || !customer.address) {
    return res.status(400).json({ error: 'بيانات العميل ناقصة' });
  }
  if (!PHONE_REGEX.test(customer.phone)) {
    return res.status(400).json({ error: 'رقم الموبايل غلط' });
  }

  const products = readData('products') || [];

  // Validate stock and compute total server-side (never trust client prices)
  let total = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return res.status(400).json({ error: `منتج غير موجود: ${item.productId}` });
    const available = product.stock[item.size] || 0;
    if (available < item.qty) {
      return res.status(400).json({ error: `الكمية المتاحة من ${product.name} (${item.size}) غير كافية` });
    }
    total += product.price * item.qty;
  }

  // Deduct stock
  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    product.stock[item.size] -= item.qty;
  });
  writeData('products', products);

  const orders = readData('orders') || [];
  const order = {
    id: 'ORD-' + Date.now().toString().slice(-6),
    items: items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return { name: product.name, size: item.size, qty: item.qty, price: product.price };
    }),
    customer,
    payment: payment || 'الدفع عند الاستلام',
    status: 'جديد',
    total,
    createdAt: new Date().toISOString(),
  };
  orders.unshift(order);
  writeData('orders', orders);

  res.status(201).json(order);
});

// GET /api/orders — admin: list all orders
router.get('/', adminAuth, (req, res) => {
  const orders = readData('orders') || [];
  res.json(orders);
});

// PATCH /api/orders/:id/status — admin: update order status
router.patch('/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['جديد', 'تم التأكيد', 'تم الشحن', 'ملغي'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }

  const orders = readData('orders') || [];
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'الطلب مش موجود' });

  order.status = status;
  writeData('orders', orders);
  res.json(order);
});

module.exports = router;
