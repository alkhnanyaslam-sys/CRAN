// routes/products.js
// Public: anyone can view the product catalog.
// Admin-only: create, edit, delete products (protected by adminAuth).

const express = require('express');
const { readData, writeData } = require('../utils/db');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// GET /api/products — public catalog
router.get('/', (req, res) => {
  const products = readData('products') || [];
  res.json(products);
});

// POST /api/products — admin: add a new product
router.post('/', adminAuth, (req, res) => {
  const { name, price, emoji, sizes, stockPerSize } = req.body;

  if (!name || !price || !Array.isArray(sizes) || sizes.length === 0) {
    return res.status(400).json({ error: 'بيانات المنتج ناقصة' });
  }

  const stock = {};
  sizes.forEach((s) => { stock[s] = Number(stockPerSize) || 0; });

  const products = readData('products') || [];
  const newProduct = {
    id: 'p' + Date.now(),
    name,
    price: Number(price),
    emoji: emoji || '👕',
    sizes,
    stock,
  };
  products.push(newProduct);
  writeData('products', products);

  res.status(201).json(newProduct);
});

// PUT /api/products/:id — admin: edit a product
router.put('/:id', adminAuth, (req, res) => {
  const products = readData('products') || [];
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'المنتج مش موجود' });

  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  writeData('products', products);
  res.json(products[idx]);
});

// DELETE /api/products/:id — admin: remove a product
router.delete('/:id', adminAuth, (req, res) => {
  let products = readData('products') || [];
  const exists = products.some((p) => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'المنتج مش موجود' });

  products = products.filter((p) => p.id !== req.params.id);
  writeData('products', products);
  res.json({ ok: true });
});

module.exports = router;
