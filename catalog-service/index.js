const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db');
const Product = require('./Product');

const app = express();
app.use(express.json());
app.use(cors());

connectDB();
require('./rabbitmq');

// Middleware to mock admin check for simplistic scenario, in a real env it would verify JWT with auth-service or API Gateway
const isAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

app.get('/health', (req, res) => res.send('Catalog Service Health OK'));

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get single product
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Add product (Admin only)
app.post('/products', isAdmin, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Edit product (Admin only)
app.put('/products/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Delete product (Admin only)
app.delete('/products/:id', isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update stock (used by checkout process/rabbitmq or direct HTTP)
app.put('/products/:id/stock', isAdmin, async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    
    product.stock -= quantity;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Optional: seed route for testing
app.post('/products/seed', async (req, res) => {
  try {
    await Product.deleteMany({});
    const seedData = [
      { name: 'Premium Wireless Headphones', description: 'Noise-cancelling over-ear headphones with 40-hour battery life.', price: 299.99, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', stock: 50 },
      { name: 'Mechanical Keyboard', description: 'Tenkeyless custom mechanical keyboard with tactile switches.', price: 149.99, imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500', stock: 30 },
      { name: 'Ergonomic Mouse', description: 'Wireless ergonomic mouse designed to reduce wrist strain.', price: 79.99, imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', stock: 100 },
      { name: '4K Ultrasharp Monitor', description: '27-inch 4K monitor with amazing color accuracy.', price: 499.99, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', stock: 15 }
    ];
    await Product.insertMany(seedData);
    res.json({ message: 'Database seeded' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Catalog Service running on port ${PORT}`);
});
