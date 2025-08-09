const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${Date.now() - start}ms`));
  next();
});

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
  )`);
}

app.get('/users', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users');
  res.json(rows);
});

app.get('/users/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
  if (rows.length === 0) return res.status(404).send('Not found');
  res.json(rows[0]);
});

app.post('/users', async (req, res) => {
  const id = uuidv4();
  const { name, email } = req.body;
  await pool.query('INSERT INTO users(id,name,email) VALUES($1,$2,$3)', [id, name, email]);
  res.status(201).json({ id, name, email });
});

const port = process.env.PORT || 3000;
init().then(() => {
  app.listen(port, () => console.log(`Users service running on ${port}`));
});
