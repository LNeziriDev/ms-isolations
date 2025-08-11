// Users service: CRUD for users, with auto-seeding and DB readiness
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
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
  )`);
  // Seed if empty
  const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS c FROM users');
  if (countRows[0].c === 0) {
    const dataPath = path.join(__dirname, '..', 'data', 'users.json');
    try {
      const users = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      for (const u of users) {
        await pool.query('INSERT INTO users(id,name,email) VALUES($1,$2,$3)', [u.id, u.name, u.email]);
      }
      console.log(`Seeded ${users.length} users`);
    } catch (e) {
      console.log('Users seed skipped or failed:', e.message);
    }
  }
}

// List users
app.get('/users', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users');
  res.json(rows);
});

// Get user by id
app.get('/users/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
  if (rows.length === 0) return res.status(404).send('Not found');
  res.json(rows[0]);
});

// Create user
app.post('/users', async (req, res) => {
  const id = uuidv4();
  const { name, email } = req.body;
  await pool.query('INSERT INTO users(id,name,email) VALUES($1,$2,$3)', [id, name, email]);
  res.status(201).json({ id, name, email });
});

// Update user (partial)
app.put('/users/:id', async (req, res) => {
  const { name, email } = req.body;
  const { rowCount } = await pool.query('UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email) WHERE id=$3', [name, email, req.params.id]);
  if (rowCount === 0) return res.status(404).send('Not found');
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
  res.json(rows[0]);
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  if (rowCount === 0) return res.status(404).send('Not found');
  res.status(204).send();
});

// Boot service after DB init
const port = process.env.PORT || 3000;
init().then(() => {
  app.listen(port, () => console.log(`Users service running on ${port}`));
});
