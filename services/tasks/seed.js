const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function seed() {
  const dataPath = path.join(__dirname, 'data', 'tasks.json');
  const tasks = JSON.parse(fs.readFileSync(dataPath));
  await pool.query('DELETE FROM tasks');
  for (const t of tasks) {
    await pool.query(
      'INSERT INTO tasks(id,title,description,assigned_to,status) VALUES($1,$2,$3,$4,$5)',
      [t.id, t.title, t.description, t.assigned_to, t.status || 'pending']
    );
  }
  console.log('Tasks seeded');
  process.exit();
}

seed();
