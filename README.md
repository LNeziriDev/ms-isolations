# ms-isolations

Sample project demonstrating isolated Node.js microservices.

## Services

- **Users service** – manages user records.
- **Tasks service** – manages tasks and resolves user names via REST calls to the Users service.
- **Products service** – manages products inventory.
- **Gateway service** – aggregates data from the other services.

## Running locally

The project uses Docker Compose to spin up the services and their PostgreSQL databases.

```bash
docker-compose up --build
```

Ports:

- Gateway service: `http://localhost:3000`
- Users service: `http://localhost:3001`
- Tasks service: `http://localhost:3002`
- Products service: `http://localhost:3003`

## Seeding data

Each service includes a `seed.js` script that loads records from a JSON dataset. Run the script inside the respective container, for example:

```bash
docker-compose run users-service node seed.js
```

Repeat for `tasks-service` and `products-service`.

## Notes

- Tasks service logs request times and degrades gracefully when the Users service is unavailable.
- The gateway aggregates data across services.
