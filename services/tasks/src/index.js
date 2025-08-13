// Tasks service: CRUD for tasks
const express = require('express'); // HTTP server framework
const { v4: uuidv4 } = require('uuid'); // UUID generator
const pool = require('./db'); // PostgreSQL pool
const seed = require('../seed'); // Seeding helper

// Track which column name is in use for product references. This allows
// the service to support schema migrations where `product_ids` is renamed
// to `products`. Version information is stored in the `schema_versions`
// table (managed below).
let productColumn = 'product_ids';

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

  // Schema versioning table to coordinate migrations between services
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_versions (
    service TEXT PRIMARY KEY,
    version INT NOT NULL
  )`);

  // Detect which column name is present for products
  const colRes = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='tasks' AND column_name IN ('product_ids','products')
  `);
  productColumn = colRes.rows[0]?.column_name || 'product_ids';

  const currentVersion = productColumn === 'product_ids' ? 1 : 2;
  await pool.query(
    `INSERT INTO schema_versions(service,version) VALUES('tasks',$1)
     ON CONFLICT(service) DO UPDATE SET version=EXCLUDED.version`,
    [currentVersion]
  );

  // Auto-seed if empty
  const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS c FROM tasks');
  if (countRows[0].c === 0) {
    await seed();
  }
}

// List tasks
app.get('/tasks', async (req, res) => {
  const { rows } = await pool.query(`SELECT id,title,description,assigned_to,status,${productColumn} AS product_ids FROM tasks`);
  res.json(rows);
});

// Get task by id
app.get('/tasks/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT id,title,description,assigned_to,status,${productColumn} AS product_ids FROM tasks WHERE id=$1`, [req.params.id]);
  if (rows.length === 0) return res.status(404).send('Not found');
  res.json(rows[0]);
});

// Create task
app.post('/tasks', async (req, res) => {
  const id = uuidv4();
  const { title, description, assigned_to, status, product_ids } = req.body;
  await pool.query(
    `INSERT INTO tasks(id,title,description,assigned_to,status,${productColumn}) VALUES($1,$2,$3,$4,$5,$6)`,
    [id, title, description, assigned_to, status || 'pending', Array.isArray(product_ids) ? product_ids : []]
  );
  res.status(201).json({ id, title, description, assigned_to, status: status || 'pending', product_ids: Array.isArray(product_ids) ? product_ids : [] });
});

// Update task (partial)
app.put('/tasks/:id', async (req, res) => {
  const { title, description, assigned_to, status, product_ids } = req.body;
  const { rowCount } = await pool.query(
    `UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), assigned_to=COALESCE($3,assigned_to), status=COALESCE($4,status), ${productColumn}=COALESCE($5,${productColumn}) WHERE id=$6`,
    [title, description, assigned_to, status, Array.isArray(product_ids) ? product_ids : null, req.params.id]
  );
  if (rowCount === 0) return res.status(404).send('Not found');
  const { rows } = await pool.query(`SELECT id,title,description,assigned_to,status,${productColumn} AS product_ids FROM tasks WHERE id=$1`, [req.params.id]);
  res.json(rows[0]);
});

// Delete task
app.delete('/tasks/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
  if (rowCount === 0) return res.status(404).send('Not found');
  res.status(204).send();
});

// --- Admin endpoints used by the demo panel ---
// Simulate an external schema change renaming the column. This intentionally
// does not update in-memory state or version tracking.
app.post('/admin/rename-productids', async (_req, res) => {
  await pool.query('ALTER TABLE tasks RENAME COLUMN product_ids TO products');
  res.json({ ok: true });
});

// Migrate the service to the latest known schema. This checks the current
// columns and updates the `schema_versions` table accordingly.
app.post('/admin/migrate', async (_req, res) => {
  try {
    const colRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='tasks' AND column_name='products'`);
    if (colRes.rowCount === 0) {
      await pool.query('ALTER TABLE tasks RENAME COLUMN product_ids TO products');
    }
    productColumn = 'products';
    await pool.query(`INSERT INTO schema_versions(service,version) VALUES('tasks',2) ON CONFLICT(service) DO UPDATE SET version=EXCLUDED.version`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Migration failed' });
  }
});

// Reset schema back to the original column name so the demo can be run again.
app.post('/admin/reset', async (_req, res) => {
  try {
    const colRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='tasks' AND column_name='products'`
    );
    if (colRes.rowCount > 0) {
      await pool.query('ALTER TABLE tasks RENAME COLUMN products TO product_ids');
    }
    productColumn = 'product_ids';
    await pool.query(
      `INSERT INTO schema_versions(service,version) VALUES('tasks',1) ON CONFLICT(service) DO UPDATE SET version=EXCLUDED.version`
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Boot service after DB init
const port = process.env.PORT || 3000;
init().then(() => {
  app.listen(port, () => console.log(`Tasks service running on ${port}`));
});
