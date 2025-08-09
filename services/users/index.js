import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.get('/users', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users LIMIT 100');
  res.json(rows);
});
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Users service running on ${PORT}`));
