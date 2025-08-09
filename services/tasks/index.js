import express from 'express';
import pkg from 'pg';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.get('/tasks/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'not found' });
  const task = rows[0];
  const product = await fetch(`http://products-service:3001/products/${task.product_id}`).then(r => r.json());
  res.json({ ...task, product });
});
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Tasks service running on ${PORT}`));
