const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function seed() {
  const dataPath = path.join(__dirname, 'data', 'tasks.json');
  const tasks = JSON.parse(fs.readFileSync(dataPath));
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
