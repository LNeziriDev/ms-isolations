const pool = require('./src/db');
const { faker } = require('@faker-js/faker');

async function seed() {
  const COUNT = 1000;
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    product_ids UUID[] DEFAULT '{}'
  )`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}'`);
  const { rows: users } = await pool.query('SELECT id FROM users');
  const { rows: products } = await pool.query('SELECT id FROM products');
  if (users.length === 0 || products.length === 0) {
    console.log('Seed users and products before tasks');
    process.exit(1);
  }
  await pool.query('DELETE FROM tasks');
  for (let i = 0; i < COUNT; i++) {
    const id = faker.string.uuid();
    const title = faker.company.catchPhrase();
    const description = faker.lorem.sentence();
    const assigned_to = faker.helpers.arrayElement(users).id;
    const product_ids = faker.helpers.arrayElements(products, faker.number.int({ min: 3, max: 10 })).map(p => p.id);
    const status = faker.helpers.arrayElement(['pending', 'in_progress', 'done']);
    await pool.query(
      'INSERT INTO tasks(id,title,description,assigned_to,status,product_ids) VALUES($1,$2,$3,$4,$5,$6)',
      [id, title, description, assigned_to, status, product_ids]
    );
  }
  console.log(`Seeded ${COUNT} tasks`);
  process.exit();
}

seed();
