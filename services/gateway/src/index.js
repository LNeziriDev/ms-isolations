const express = require('express');
const path = require('path');

const USERS_URL = process.env.USERS_URL || 'http://users-service:3000';
const TASKS_URL = process.env.TASKS_URL || 'http://tasks-service:3000';
const PRODUCTS_URL = process.env.PRODUCTS_URL || 'http://products-service:3000';

const app = express();

// Allow the HTML pages to call back into the gateway even when they are
// opened directly from the filesystem. This sets a permissive CORS header
// which enables requests from a `file:` origin.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Serve the static front-end assets (index.html, user.html, etc.)
// so the browser can load them over HTTP instead of the `file:` protocol.

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Explicitly return the home page when the root or `/index.html` is requested.
app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${Date.now() - start}ms`));
  next();
});

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

app.get('/users', (req, res) => proxy(`${USERS_URL}/users`, res));
app.get('/products', (req, res) => proxy(`${PRODUCTS_URL}/products`, res));
app.get('/tasks', (req, res) => proxy(`${TASKS_URL}/tasks`, res));

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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Gateway service running on ${port}`));
