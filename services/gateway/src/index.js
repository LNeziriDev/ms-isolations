const express = require('express');

const USERS_URL = process.env.USERS_URL || 'http://users-service:3000';
const TASKS_URL = process.env.TASKS_URL || 'http://tasks-service:3000';
const PRODUCTS_URL = process.env.PRODUCTS_URL || 'http://products-service:3000';

const app = express();
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${Date.now() - start}ms`));
  next();
});

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
