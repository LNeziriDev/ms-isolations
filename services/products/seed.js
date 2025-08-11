const pool = require('./src/db');
const { faker } = require('@faker-js/faker');

/**
 * Seed the products table with fake entries. Exported so the service
 * can invoke it during startup when the table is empty. Retains the
 * original CLI behaviour when executed directly.
 */
async function seed() {
  const COUNT = 1000;
  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0
  )`);
  await pool.query('DELETE FROM products');
  for (let i = 0; i < COUNT; i++) {
    const id = faker.string.uuid();
    const name = faker.commerce.productName();
    const price = parseFloat(faker.commerce.price());
    const stock = faker.number.int({ min: 0, max: 1000 });
    await pool.query('INSERT INTO products(id,name,price,stock) VALUES($1,$2,$3,$4)', [id, name, price, stock]);
  }
  console.log(`Seeded ${COUNT} products`);
}

if (require.main === module) {
  seed().then(() => process.exit()).catch(err => {
    console.error('Product seeding failed', err);
    process.exit(1);
  });
}

module.exports = seed;
