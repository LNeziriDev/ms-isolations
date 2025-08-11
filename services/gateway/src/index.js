// Minimal API gateway that serves static assets and forwards REST calls
const express = require('express'); // HTTP server framework
const path = require('path'); // Filesystem path helpers

// Internal service base URLs (Docker network hostnames)
const USERS_URL = process.env.USERS_URL || 'http://users-service:3000';
const TASKS_URL = process.env.TASKS_URL || 'http://tasks-service:3000';
const PRODUCTS_URL = process.env.PRODUCTS_URL || 'http://products-service:3000';

// Create app and parse JSON bodies for proxying write operations
const app = express();
app.use(express.json());

// Allow the HTML pages to call back into the gateway even when they are
// opened directly from the filesystem. This sets a permissive CORS header
// which enables requests from a `file:` origin.
// Allow cross-origin access for the SPA and local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Serve the legacy static demo pages (not the SPA)
const publicDir = path.join('public');
app.use(express.static(publicDir));

// Explicitly return the home page when the root or `/index.html` is requested.
app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Simple access log with response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${Date.now() - start}ms`));
  next();
});

// Back-compat simple proxy used by static demo pages
async function proxy(url, res) {
  const start = Date.now();
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json({ data, time: Date.now() - start });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

// Generic proxy helper forwarding method, headers, and optional JSON body
async function forward(req, res, targetBase, pathSuffix = '') {
  const url = `${targetBase}${pathSuffix}`;
  const start = Date.now();
  try {
    const init = { method: req.method, headers: { 'Content-Type': 'application/json' } };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : undefined;
    }
    const response = await fetch(url, init);
    const text = await response.text();
    res.status(response.status);
    try {
      const json = text ? JSON.parse(text) : null;
      res.json(json);
    } catch {
      res.send(text);
    }
    console.log(`${req.method} ${url} -> ${response.status} ${Date.now() - start}ms`);
  } catch (err) {
    res.status(500).json({ error: 'Upstream request failed' });
  }
}

// Users CRUD
app.get('/users', (req, res) => forward(req, res, USERS_URL, '/users'));
app.post('/users', (req, res) => forward(req, res, USERS_URL, '/users'));
app.get('/users/:id', (req, res) => forward(req, res, USERS_URL, `/users/${req.params.id}`));
app.put('/users/:id', (req, res) => forward(req, res, USERS_URL, `/users/${req.params.id}`));
app.delete('/users/:id', (req, res) => forward(req, res, USERS_URL, `/users/${req.params.id}`));

// Products CRUD
app.get('/products', (req, res) => forward(req, res, PRODUCTS_URL, '/products'));
app.post('/products', (req, res) => forward(req, res, PRODUCTS_URL, '/products'));
app.get('/products/:id', (req, res) => forward(req, res, PRODUCTS_URL, `/products/${req.params.id}`));
app.put('/products/:id', (req, res) => forward(req, res, PRODUCTS_URL, `/products/${req.params.id}`));
app.delete('/products/:id', (req, res) => forward(req, res, PRODUCTS_URL, `/products/${req.params.id}`));

// Tasks CRUD
app.get('/tasks', (req, res) => forward(req, res, TASKS_URL, '/tasks'));
app.post('/tasks', (req, res) => forward(req, res, TASKS_URL, '/tasks'));
app.get('/tasks/:id', (req, res) => forward(req, res, TASKS_URL, `/tasks/${req.params.id}`));
app.put('/tasks/:id', (req, res) => forward(req, res, TASKS_URL, `/tasks/${req.params.id}`));
app.delete('/tasks/:id', (req, res) => forward(req, res, TASKS_URL, `/tasks/${req.params.id}`));

// Aggregate summary used by the SPA home screen
app.get('/summary', async (req, res) => {
  try {
    const [usersRes, tasksRes, productsRes] = await Promise.all([
      fetch(`${USERS_URL}/users`),
      fetch(`${TASKS_URL}/tasks`),
      fetch(`${PRODUCTS_URL}/products`)
    ]);
    const [users, tasks, products] = await Promise.all([
      usersRes.json(),
      tasksRes.json(),
      productsRes.json()
    ]);
    res.json({ users, tasks, products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Expanded summary joining tasks with product details for each user
app.get('/summary-with-joins', async (_req, res) => {
  try {
    const [usersRes, tasksRes, productsRes] = await Promise.all([
      fetch(`${USERS_URL}/users`),
      fetch(`${TASKS_URL}/tasks`),
      fetch(`${PRODUCTS_URL}/products`)
    ]);
    const [users, tasks, products] = await Promise.all([
      usersRes.json(),
      tasksRes.json(),
      productsRes.json()
    ]);
    const productsById = Object.fromEntries(products.map(p => [p.id, p]));
    const tasksWithProducts = tasks.map(t => ({
      ...t,
      products: Array.isArray(t.product_ids) ? t.product_ids.map(id => productsById[id]).filter(Boolean) : []
    }));
    const usersWith = users.map(u => ({
      ...u,
      tasks: tasksWithProducts.filter(t => t.assigned_to === u.id)
    }));
    res.json(usersWith);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Boot the gateway
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Gateway service running on ${port}`));
