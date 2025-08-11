// Tasks service: CRUD for tasks, enriches with user names, seeds links to products
const express = require('express'); // HTTP server framework
const axios = require('axios'); // HTTP client to call Users/Products services
const { v4: uuidv4 } = require('uuid'); // UUID generator
const pool = require('./db'); // PostgreSQL pool

// Internal URLs to related services
const USERS_SERVICE_URL = process.env.USERS_URL || 'http://users-service:3000';
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_URL || 'http://products-service:3000';

// Create app, parse JSON, and log requests with timing
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${Date.now() - start}ms`));
  next();
});
// Permit cross-origin requests from the SPA and other tools
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
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
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    product_ids UUID[] DEFAULT '{}'
  )`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}'`);
  // Seed if empty: create some tasks linked to existing users/products if available
  const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS c FROM tasks');
  if (countRows[0].c === 0) {
    try {
      const [usersRes, productsRes] = await Promise.allSettled([
        axios.get(`${USERS_SERVICE_URL}/users`),
        axios.get(`${PRODUCTS_SERVICE_URL}/products`)
      ]);
      const users = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const products = productsRes.status === 'fulfilled' ? productsRes.value.data : [];
      const pick = (arr, n) => arr.slice(0, Math.max(0, Math.min(n, arr.length)));
      const sampleUsers = pick(users, 5);
      const sampleProducts = pick(products, 5);
      let i = 1;
      for (const u of sampleUsers) {
        const id = uuidv4();
        const product_ids = sampleProducts.filter((_, idx) => (idx + i) % 2 === 0).map(p => p.id);
        await pool.query(
          'INSERT INTO tasks(id,title,description,assigned_to,status,product_ids) VALUES($1,$2,$3,$4,$5,$6)',
          [id, `Seed Task ${i}`, `Auto-seeded task ${i} for ${u.name}`, u.id, 'pending', product_ids]
        );
        i++;
      }
      console.log(`Seeded ${i - 1} tasks`);
    } catch (e) {
      console.log('Tasks seed skipped or failed:', e.message);
    }
  }
}

// List tasks (enriched with assigned user name)
app.get('/tasks', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tasks');
  const tasks = await Promise.all(rows.map(async (task) => {
    const start = Date.now();
    try {
      const resp = await axios.get(`${USERS_SERVICE_URL}/users/${task.assigned_to}`);
      console.log(`Fetched user ${task.assigned_to} in ${Date.now() - start}ms`);
      return { ...task, assigned_name: resp.data.name };
    } catch (e) {
      console.log(`Users service unavailable for ${task.assigned_to}, using ID`);
      return { ...task, assigned_name: task.assigned_to };
    }
  }));
  res.json(tasks);
});

// Get task by id (enriched)
app.get('/tasks/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
  if (rows.length === 0) return res.status(404).send('Not found');
  const task = rows[0];
  try {
    const resp = await axios.get(`${USERS_SERVICE_URL}/users/${task.assigned_to}`);
    return res.json({ ...task, assigned_name: resp.data.name });
  } catch {
    return res.json({ ...task, assigned_name: task.assigned_to });
  }
});

// Create task
app.post('/tasks', async (req, res) => {
  const id = uuidv4();
  const { title, description, assigned_to, status, product_ids } = req.body;
  await pool.query(
    'INSERT INTO tasks(id,title,description,assigned_to,status,product_ids) VALUES($1,$2,$3,$4,$5,$6)',
    [id, title, description, assigned_to, status || 'pending', Array.isArray(product_ids) ? product_ids : []]
  );
  res.status(201).json({ id, title, description, assigned_to, status: status || 'pending', product_ids: Array.isArray(product_ids) ? product_ids : [] });
});

// Update task (partial)
app.put('/tasks/:id', async (req, res) => {
  const { title, description, assigned_to, status, product_ids } = req.body;
  const { rowCount } = await pool.query(
    'UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), assigned_to=COALESCE($3,assigned_to), status=COALESCE($4,status), product_ids=COALESCE($5,product_ids) WHERE id=$6',
    [title, description, assigned_to, status, Array.isArray(product_ids) ? product_ids : null, req.params.id]
  );
  if (rowCount === 0) return res.status(404).send('Not found');
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
  res.json(rows[0]);
});

// Delete task
app.delete('/tasks/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
  if (rowCount === 0) return res.status(404).send('Not found');
  res.status(204).send();
});

// Boot service after DB init
const port = process.env.PORT || 3000;
init().then(() => {
  app.listen(port, () => console.log(`Tasks service running on ${port}`));
});
