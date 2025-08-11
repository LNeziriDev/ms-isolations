const { execSync } = require('child_process');

async function run() {
  const scripts = [
    'services/users/seed.js',
    'services/products/seed.js',
    'services/tasks/seed.js'
  ];
  for (const script of scripts) {
    console.log(`Seeding ${script}...`);
    execSync(`node ${script}`, { stdio: 'inherit', env: process.env });
  }
}

run().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
