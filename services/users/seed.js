const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function seed() {
  const dataPath = path.join(__dirname, 'data', 'users.json');
  const users = JSON.parse(fs.readFileSync(dataPath));
  await pool.query('DELETE FROM users');
  for (const u of users) {
    await pool.query('INSERT INTO users(id,name,email) VALUES($1,$2,$3)', [u.id, u.name, u.email]);
  }
  console.log('Users seeded');
  process.exit();
}

seed();
