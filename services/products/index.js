import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.get('/products', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products LIMIT 100');
  res.json(rows);
});
app.get('/products/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Products service running on ${PORT}`));
