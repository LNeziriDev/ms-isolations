const pool = require('./src/db');
const { faker } = require('@faker-js/faker');

/**
 * Populate the users table with fake data.
 * Exported so the service can trigger seeding on startup when the
 * table is empty. When run directly this file behaves like the
 * original CLI seeder.
 */
async function seed() {
  const COUNT = 1000;
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
  )`);
  await pool.query('DELETE FROM users');
  for (let i = 0; i < COUNT; i++) {
    const id = faker.string.uuid();
    const name = faker.person.fullName();
    const email = faker.internet.email({ firstName: name.split(' ')[0] });
    await pool.query('INSERT INTO users(id,name,email) VALUES($1,$2,$3)', [id, name, email]);
  }
  console.log(`Seeded ${COUNT} users`);
}

// When executed directly via `node seed.js` run immediately.
if (require.main === module) {
  seed().then(() => process.exit()).catch(err => {
    console.error('User seeding failed', err);
    process.exit(1);
  });
}

module.exports = seed;
