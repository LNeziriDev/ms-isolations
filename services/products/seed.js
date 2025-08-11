const pool = require('./src/db');
const { faker } = require('@faker-js/faker');

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
  process.exit();
}

seed();
