# Running the microservices

1. Build and start all services (DBs, APIs, gateway, frontend):
   ```bash
   docker-compose up --build -d
   ```
   - Auto-seeding: on first boot, each API seeds its database if empty.

2. Access the apps:
   - Frontend SPA: http://localhost:8080
   - Gateway summary: http://localhost:3000/summary
   - Users API: http://localhost:3001/users
   - Tasks API: http://localhost:3002/tasks
   - Products API: http://localhost:3003/products

3. View logs (tail):
   ```bash
   docker-compose logs -f --tail=100
   ```

4. Stop and clean up:
   ```bash
   docker-compose down
   ```
