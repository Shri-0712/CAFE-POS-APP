import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

let db;
initDB().then(database => db = database);

// Get active orders
app.get('/api/orders/active', async (req, res) => {
  const orders = await db.all(`SELECT * FROM orders WHERE status='active'`);
  res.json(orders);
});

// Get completed orders
app.get('/api/orders/completed', async (req, res) => {
  const orders = await db.all(`SELECT * FROM orders WHERE status='completed'`);
  res.json(orders);
});

// Create new order
app.post('/api/orders', async (req, res) => {
  const { items } = req.body;
  const result = await db.run(
    `INSERT INTO orders (status, items) VALUES (?, ?)`,
    ['active', JSON.stringify(items)]
  );
  res.json({ id: result.lastID, items });
});

// Complete order
app.post('/api/orders/:id/complete', async (req, res) => {
  const { id } = req.params;
  await db.run(`UPDATE orders SET status='completed' WHERE id=?`, [id]);
  res.json({ success: true });
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));