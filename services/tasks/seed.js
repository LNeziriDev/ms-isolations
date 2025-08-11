const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function seed() {
  const dataPath = path.join(__dirname, 'data', 'tasks.json');
  const tasks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    product_ids UUID[] DEFAULT '{}'
  )`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}'`);
  await pool.query('DELETE FROM tasks');
  for (const t of tasks) {
    await pool.query(
      'INSERT INTO tasks(id,title,description,assigned_to,status,product_ids) VALUES($1,$2,$3,$4,$5,$6)',
      [t.id, t.title, t.description, t.assigned_to, t.status || 'pending', Array.isArray(t.product_ids) ? t.product_ids : []]
    );
  }
  console.log('Tasks seeded');
  process.exit();
}

seed();
