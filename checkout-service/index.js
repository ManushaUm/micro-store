const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

// RabbitMQ will be added in Phase 4

const app = express();
app.use(express.json());
app.use(cors());

db.initDB();

const verifyUser = (req, res, next) => {
  const userId = req.headers['x-user-id']; 
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = userId;
  next();
};

const isAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

app.get('/health', (req, res) => res.send('Checkout Service Health OK'));

// Create order
app.post('/checkout', verifyUser, async (req, res) => {
  const { items, total } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  try {
    // Basic implementation. Caching & robust transaction control could go here
    const result = await db.query(
      'INSERT INTO orders (user_id, total, items, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, total, JSON.stringify(items), 'Placed']
    );

    const order = result.rows[0];

    const { publishOrder } = require('./rabbitmq');
    await publishOrder({ orderId: order.id, userId: order.user_id, items: typeof items === 'string' ? JSON.parse(items) : items });

    res.status(201).json({ message: 'Order successful', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get user orders (Order Tracking)
app.get('/orders', verifyUser, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Admin: Get all orders
app.get('/admin/orders', isAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Admin: Update order status
app.put('/admin/orders/:id/status', isAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await db.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Checkout Service running on port ${PORT}`);
});
