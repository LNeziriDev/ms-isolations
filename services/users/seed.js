const pool = require('./src/db');
const { faker } = require('@faker-js/faker');

async function seed() {
  const COUNT = 1000;
  await pool.query('DELETE FROM users');
  for (let i = 0; i < COUNT; i++) {
    const id = faker.string.uuid();
    const name = faker.person.fullName();
    const email = faker.internet.email({ firstName: name.split(' ')[0] });
    await pool.query('INSERT INTO users(id,name,email) VALUES($1,$2,$3)', [id, name, email]);
  }
  console.log(`Seeded ${COUNT} users`);
  process.exit();
}

seed();
