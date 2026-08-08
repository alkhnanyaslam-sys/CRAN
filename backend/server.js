// server.js
// Entry point: wires up middleware, routes, and (optionally) serves
// the frontend build so the whole site can run from one process.

const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);

// Serve the frontend statically (so you can deploy backend + frontend together)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`CRWN backend running on http://localhost:${PORT}`);
});
