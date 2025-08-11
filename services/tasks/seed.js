const pool = require('./src/db');
const { faker } = require('@faker-js/faker');

/**
 * Seed the tasks table with fake data referencing existing users and
 * products. Exported so the service can trigger seeding on startup when
 * the table is empty. When invoked directly it behaves as a CLI
 * seeding script.
 */
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

  // Fetch existing users and products from their respective services
  const usersUrl = `${process.env.USERS_URL || 'http://localhost:3001'}/users`;
  const productsUrl = `${process.env.PRODUCTS_URL || 'http://localhost:3003'}/products`;

  let users = [];
  let products = [];
  try {
    users = await fetch(usersUrl).then(r => r.json());
    products = await fetch(productsUrl).then(r => r.json());
  } catch (e) {
    console.log('Failed to fetch users/products:', e.message);
    throw e;
  }
  if (!Array.isArray(users) || !Array.isArray(products) || users.length === 0 || products.length === 0) {
    throw new Error('Seed users and products before tasks');
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
}

if (require.main === module) {
  seed().then(() => process.exit()).catch(err => {
    console.error('Task seeding failed', err);
    process.exit(1);
  });
}

module.exports = seed;
