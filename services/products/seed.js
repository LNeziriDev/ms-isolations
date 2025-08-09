const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function seed() {
  const dataPath = path.join(__dirname, 'data', 'products.json');
  const products = JSON.parse(fs.readFileSync(dataPath));
  await pool.query('DELETE FROM products');
  for (const p of products) {
    await pool.query('INSERT INTO products(id,name,price,stock) VALUES($1,$2,$3,$4)', [p.id, p.name, p.price, p.stock]);
  }
  console.log('Products seeded');
  process.exit();
}

seed();
