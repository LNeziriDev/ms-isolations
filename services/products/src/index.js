// Products service: CRUD for products, with auto-seeding and DB readiness
const express = require('express'); // HTTP server framework
const fs = require('fs'); // Filesystem access for seeding
const path = require('path'); // Path helpers
const { v4: uuidv4 } = require('uuid'); // UUID generator
const pool = require('./db'); // PostgreSQL pool

// Create app and parse JSON bodies
const app = express();
app.use(express.json());
// Permit cross-origin requests from the SPA and other tools
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${Date.now() - start}ms`));
  next();
});

async function init() {
  // Wait for DB to be ready
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (e) {
      console.log(`DB not ready (attempt ${attempt})`);
      await new Promise(r => setTimeout(r, 1000));
      if (attempt === 30) throw e;
    }
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0
  )`);
  // Seed if empty
  const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS c FROM products');
  if (countRows[0].c === 0) {
    const dataPath = path.join(__dirname, '..', 'data', 'products.json');
    try {
      const items = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      for (const p of items) {
        await pool.query('INSERT INTO products(id,name,price,stock) VALUES($1,$2,$3,$4)', [p.id, p.name, p.price, p.stock || 0]);
      }
      console.log(`Seeded ${items.length} products`);
    } catch (e) {
      console.log('Products seed skipped or failed:', e.message);
    }
  }
}

// List products
app.get('/products', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products');
  res.json(rows);
});

// Get product by id
app.get('/products/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (rows.length === 0) return res.status(404).send('Not found');
  res.json(rows[0]);
});

// Create product
app.post('/products', async (req, res) => {
  const id = uuidv4();
  const { name, price, stock } = req.body;
  await pool.query('INSERT INTO products(id,name,price,stock) VALUES($1,$2,$3,$4)', [id, name, price, stock || 0]);
  res.status(201).json({ id, name, price, stock: stock || 0 });
});

// Update product (partial)
app.put('/products/:id', async (req, res) => {
  const { name, price, stock } = req.body;
  const { rowCount } = await pool.query(
    'UPDATE products SET name=COALESCE($1,name), price=COALESCE($2,price), stock=COALESCE($3,stock) WHERE id=$4',
    [name, price, stock, req.params.id]
  );
  if (rowCount === 0) return res.status(404).send('Not found');
  const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  res.json(rows[0]);
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  if (rowCount === 0) return res.status(404).send('Not found');
  res.status(204).send();
});

// Boot service after DB init
const port = process.env.PORT || 3000;
init().then(() => {
  app.listen(port, () => console.log(`Products service running on ${port}`));
});
