const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db');

const USERS_SERVICE_URL = process.env.USERS_URL || 'http://users-service:3000';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${Date.now() - start}ms`));
  next();
});

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
  )`);
}

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

app.post('/tasks', async (req, res) => {
  const id = uuidv4();
  const { title, description, assigned_to, status } = req.body;
  await pool.query('INSERT INTO tasks(id,title,description,assigned_to,status) VALUES($1,$2,$3,$4,$5)', [id, title, description, assigned_to, status || 'pending']);
  res.status(201).json({ id, title, description, assigned_to, status: status || 'pending' });
});

const port = process.env.PORT || 3000;
init().then(() => {
  app.listen(port, () => console.log(`Tasks service running on ${port}`));
});
