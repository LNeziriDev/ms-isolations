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
  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0
  )`);
}

app.get('/products', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products');
  res.json(rows);
});

app.post('/products', async (req, res) => {
  const id = uuidv4();
  const { name, price, stock } = req.body;
  await pool.query('INSERT INTO products(id,name,price,stock) VALUES($1,$2,$3,$4)', [id, name, price, stock || 0]);
  res.status(201).json({ id, name, price, stock: stock || 0 });
});

const port = process.env.PORT || 3000;
init().then(() => {
  app.listen(port, () => console.log(`Products service running on ${port}`));
});
