# Running the microservices

1. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```
2. Seed databases with the provided datasets:
   ```bash
   docker-compose run users-service node seed.js
   docker-compose run tasks-service node seed.js
   docker-compose run products-service node seed.js
   ```
3. Access the services:
   - Gateway: http://localhost:3000/summary
   - Users: http://localhost:3001/users
   - Tasks: http://localhost:3002/tasks
   - Products: http://localhost:3003/products
4. Stop all containers:
   ```bash
   docker-compose down
   ```
